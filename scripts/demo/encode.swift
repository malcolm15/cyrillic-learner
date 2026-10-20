// Encodes a PNG sequence plus its capture timestamps into an H.264 MP4 using
// AVFoundation, which ships with macOS. No third-party tooling.
//
// Real capture timestamps are used everywhere, so the normal-speed portions keep
// the pacing they were recorded at. Freeze-frame holds are inserted purely by
// shifting later timestamps: the held frame is written once and the next frame
// is scheduled HOLD seconds later, so the decoder shows it for that long. No
// page timing was changed to achieve this.
//
// usage: swift encode.swift <framesDir> <out.mp4> <holdSeconds> <bitrate> <tailSeconds> <markA> <markB>
//        markA and markB are frame indices to hold on (-1 for none).
//        tailSeconds is how long the LAST frame stays on screen. A still page
//        emits no screencast frames, so a pause at the end cannot be recorded;
//        it has to be set here. The wide take ends on its opening frame, and
//        this is the rest before the loop repeats.
//
// That rest has to be real samples. See the note above the tail loop below for
// the two ways of faking it that do not work.
import Foundation
import AVFoundation
import CoreGraphics
import ImageIO

// This tool only ever ADDS a file. It never deletes and never overwrites, so
// the argument list has to be complete and the output path has to be free.
guard CommandLine.arguments.count >= 6,
      !CommandLine.arguments[1].isEmpty,
      !CommandLine.arguments[2].isEmpty else {
    FileHandle.standardError.write(Data(
        "usage: swift encode.swift <framesDir> <out.mp4> <holdSeconds> <bitrate> <tailSeconds> [frameToHold ...]\n".utf8))
    exit(2)
}
let dir = CommandLine.arguments[1]
let outURL = URL(fileURLWithPath: CommandLine.arguments[2])
let hold = Double(CommandLine.arguments[3]) ?? 2.0
let bitrate = Int(CommandLine.arguments[4]) ?? 400_000
let tailHold = Double(CommandLine.arguments[5]) ?? 0.05
let holdFrames = Array(CommandLine.arguments.dropFirst(6)).compactMap { Int($0) }.filter { $0 >= 0 }
if FileManager.default.fileExists(atPath: outURL.path) {
    FileHandle.standardError.write(Data(
        "refusing to write \(outURL.path): it already exists. This tool never overwrites; remove it yourself or choose another name.\n".utf8))
    exit(2)
}

struct Manifest: Decodable {
    struct F: Decodable { let file: String; let t: Double }
    struct Crop: Decodable { let x: Int; let y: Int; let w: Int; let h: Int }
    struct Size: Decodable { let w: Int; let h: Int }
    let frames: [F]
    let cropCss: Crop
    let viewport: Size
}
let mdata = try Data(contentsOf: URL(fileURLWithPath: dir + "/manifest.json"))
let manifest = try JSONDecoder().decode(Manifest.self, from: mdata)
guard !manifest.frames.isEmpty else { fatalError("no frames") }

// Timeline: start from the real capture times, then add `hold` to every frame
// after each held frame. The held frame keeps its own time, so it simply stays
// on screen until the next one.
var times = manifest.frames.map { $0.t }
// Screencast only emits a frame when the page changes, so a still moment can
// leave a long gap. Clamp gaps to CLAMP seconds: dead air shrinks, motion is
// untouched because moving frames arrive far closer together than the clamp.
let CLAMP = 0.25
// Screencast timestamps are not always strictly increasing: duplicates appear
// when two compositor frames share a tick, and AVAssetWriter rejects a frame
// whose presentation time does not advance (error -16364). Clamp long gaps for
// dead air and floor short ones so every frame gets its own time.
let MINDELTA = 1.0 / 120.0
if times.count > 1 {
    var acc = [times[0]]
    for i in 1..<times.count {
        let raw = times[i] - times[i-1]
        let gap = max(MINDELTA, min(raw, CLAMP))
        acc.append(acc[i-1] + gap)
    }
    times = acc
}
for idx in holdFrames.sorted() {
    guard idx + 1 < times.count else { continue }
    for j in (idx + 1)..<times.count { times[j] += hold }
}
let startT = times[0]
times = times.map { $0 - startT }

func loadCG(_ path: String) -> CGImage {
    let url = URL(fileURLWithPath: path) as CFURL
    guard let src = CGImageSourceCreateWithURL(url, nil),
          let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { fatalError("cannot read \(path)") }
    return img
}
let first = loadCG(dir + "/" + manifest.frames[0].file)
// Screencast gives the whole viewport. The crop is derived from the frame size
// actually received, never an assumed device scale: the first take assumed 2x
// and cropped 928x860 out of frames that arrived at 480x780.
let scale = Double(first.width) / Double(manifest.viewport.w)
let cx = Int((Double(manifest.cropCss.x) * scale).rounded())
let cy = Int((Double(manifest.cropCss.y) * scale).rounded())
let cw0 = Int((Double(manifest.cropCss.w) * scale).rounded())
let chh0 = Int((Double(manifest.cropCss.h) * scale).rounded())
let W = min(cw0 - (cw0 % 2), first.width - cx)
let H = min(chh0 - (chh0 % 2), first.height - cy)
print("  source frame: \(first.width)x\(first.height)   measured scale: \(scale)x")
print("  crop applied: x=\(cx) y=\(cy) w=\(W) h=\(H)")
let TS: CMTimeScale = 600

let writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
let settings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: W, AVVideoHeightKey: H,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: bitrate,
        AVVideoMaxKeyFrameIntervalKey: 60,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    ],
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime = false
let attrs: [String: Any] = [kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32ARGB),
                            kCVPixelBufferWidthKey as String: W, kCVPixelBufferHeightKey as String: H]
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: attrs)
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

var pool: CVPixelBufferPool?
CVPixelBufferPoolCreate(kCFAllocatorDefault, nil, attrs as CFDictionary, &pool)

func appendFrame(_ img: CGImage, at t: Double, label: String) {
    var pb: CVPixelBuffer?
    CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, pool!, &pb)
    guard let buf = pb else { fatalError("no pixel buffer") }
    CVPixelBufferLockBaseAddress(buf, [])
    let ctx = CGContext(data: CVPixelBufferGetBaseAddress(buf), width: W, height: H,
                        bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(buf),
                        space: CGColorSpaceCreateDeviceRGB(),
                        bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
    // draw the source so that the crop rect lands on the buffer origin;
    // CoreGraphics y is bottom-up, hence the flip of cy.
    let offY = -(img.height - cy - H)
    ctx.draw(img, in: CGRect(x: -cx, y: offY, width: img.width, height: img.height))
    CVPixelBufferUnlockBaseAddress(buf, [])
    while !input.isReadyForMoreMediaData { usleep(1500) }
    if !adaptor.append(buf, withPresentationTime: CMTime(seconds: t, preferredTimescale: TS)) {
        fatalError("append failed at \(label): \(String(describing: writer.error))")
    }
}
for (i, f) in manifest.frames.enumerated() {
    appendFrame(loadCG(dir + "/" + f.file), at: times[i], label: "frame \(i)")
}
// The rest at the end is written as a RUN of repeats of the final frame at a
// normal frame interval. Two simpler things were tried and both failed:
//   1. moving endSession later on its own left the final sample's duration
//      implicit, so the stream stopped a full second short of its own duration;
//   2. one extra sample a frame before the end was worse in a different way.
//      AVAssetWriter derives each sample's duration from the NEXT sample's
//      time and, having no next sample, gives the last one the PREVIOUS gap's
//      duration. The last sample inherited 0.983s, the track ran past
//      endSession, and Chrome held the final frame for 1.97s instead of 1.00s.
// A run of ordinary frames leaves no unusual sample anywhere in the file, so
// the rest is exactly as long as asked and the track ends where it says it does.
let tail = max(tailHold, 0.05)
let FRAME_DT = 1.0 / 60.0
let endT = times.last! + tail
let lastImg = loadCG(dir + "/" + manifest.frames[manifest.frames.count - 1].file)
var tailSamples = 0
var tt = times.last! + FRAME_DT
while tt < endT - 1e-9 {
    appendFrame(lastImg, at: tt, label: "tail frame \(tailSamples)")
    tailSamples += 1
    tt += FRAME_DT
}
input.markAsFinished()
writer.endSession(atSourceTime: CMTime(seconds: endT, preferredTimescale: TS))
let sem = DispatchSemaphore(value: 0)
writer.finishWriting { sem.signal() }
sem.wait()
if writer.status != .completed { fatalError("writer: \(String(describing: writer.error))") }

let size = (try? FileManager.default.attributesOfItem(atPath: outURL.path)[.size] as? Int) ?? 0
print("  wrote \(outURL.path)")
print("  frames: \(manifest.frames.count)   dimensions: \(W)x\(H)   bitrate asked: \(bitrate/1000) kbps   size: \(size/1024) KB")
for idx in holdFrames.sorted() {
    if idx < times.count { print("  hold at frame \(idx): starts \(String(format: "%.3f", times[idx]))s, next frame \(String(format: "%.3f", idx+1 < times.count ? times[idx+1] : times[idx]))s") }
}
print("  real last frame at \(String(format: "%.3f", times.last!))s, then \(tailSamples) repeats of it at \(String(format: "%.4f", FRAME_DT))s intervals, stream ends \(String(format: "%.3f", endT))s")
print("  planned duration: \(String(format: "%.3f", endT))s")
