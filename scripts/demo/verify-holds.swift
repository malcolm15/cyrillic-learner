// Reads a finished MP4 back and proves its holds with zero tolerance, so the
// decoder returns the frame actually shown at each time rather than the nearest
// keyframe. Also saves named stills, and the first and last frames so the loop
// seam can be compared pixel for pixel. It only ever ADDS files, and refuses
// if any output it would write already exists.
//
// usage: swift verify-holds.swift <mp4> <outDir> <prefix> holds=s:e,s:e stills=name@t,name@t
import Foundation
import AVFoundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let url = URL(fileURLWithPath: CommandLine.arguments[1])
let outDir = CommandLine.arguments[2]
let prefix = CommandLine.arguments[3]
var holdArgs: [(Double, Double)] = []
var stillArgs: [(String, Double)] = []
for a in CommandLine.arguments.dropFirst(4) {
    if a.hasPrefix("holds=") {
        for p in a.dropFirst(6).split(separator: ",") {
            let q = p.split(separator: ":")
            if q.count == 2, let s = Double(q[0]), let e = Double(q[1]) { holdArgs.append((s, e)) }
        }
    } else if a.hasPrefix("stills=") {
        for p in a.dropFirst(7).split(separator: ",") {
            let q = p.split(separator: "@")
            if q.count == 2, let t = Double(q[1]) { stillArgs.append((String(q[0]), t)) }
        }
    }
}
// Every file this run would write, checked before any work happens. This tool
// never overwrites: an existing output means a previous run, and replacing it
// would destroy the stills that run was judged on.
let willWrite = stillArgs.map { outDir + "/" + prefix + $0.0 + ".png" }
    + [outDir + "/" + prefix + "seam-first.png", outDir + "/" + prefix + "seam-last.png"]
let clash = willWrite.filter { FileManager.default.fileExists(atPath: $0) }
if !clash.isEmpty {
    FileHandle.standardError.write(Data(
        "refusing to write \(clash.count) file(s) that already exist:\n  \(clash.joined(separator: "\n  "))\n".utf8))
    exit(2)
}

let sem = DispatchSemaphore(value: 0)
var failures = 0
func save(_ img: CGImage, _ path: String) {
    guard let d = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL,
        UTType.png.identifier as CFString, 1, nil) else { return }
    CGImageDestinationAddImage(d, img, nil)
    CGImageDestinationFinalize(d)
}
Task {
    let asset = AVURLAsset(url: url)
    let dur = try await asset.load(.duration)
    let tracks = try await asset.loadTracks(withMediaType: .video)
    guard let t = tracks.first else { fatalError("no video track") }
    let size = try await t.load(.naturalSize)
    let fps = try await t.load(.nominalFrameRate)
    let rate = try await t.load(.estimatedDataRate)
    for d in try await t.load(.formatDescriptions) {
        let c = CMFormatDescriptionGetMediaSubType(d)
        let ch = [UInt8((c >> 24) & 255), UInt8((c >> 16) & 255), UInt8((c >> 8) & 255), UInt8(c & 255)]
        print("  codec: \(String(bytes: ch, encoding: .ascii) ?? "?")")
    }
    print("  duration: \(String(format: "%.3f", dur.seconds))s   dimensions: \(Int(size.width))x\(Int(size.height))")
    print("  nominal fps: \(String(format: "%.1f", fps))   estimated data rate: \(String(format: "%.0f", rate/1000)) kbps")

    let gen = AVAssetImageGenerator(asset: asset)
    gen.requestedTimeToleranceBefore = .zero
    gen.requestedTimeToleranceAfter = .zero
    gen.appliesPreferredTrackTransform = true

    for (i, h) in holdArgs.enumerated() {
        print("  --- hold \(i+1): \(String(format: "%.3f", h.0))s to \(String(format: "%.3f", h.1))s")
        var decoded: [Double] = []
        for frac in [0.15, 0.40, 0.65, 0.90] {
            let tt = h.0 + (h.1 - h.0) * frac
            let (img, actual) = try await gen.image(at: CMTime(seconds: tt, preferredTimescale: 600))
            decoded.append(actual.seconds)
            print("      sample t=\(String(format: "%.3f", tt))s  decoded frame time \(String(format: "%.3f", actual.seconds))s  \(Int(img.width))x\(Int(img.height))")
        }
        let allSame = decoded.allSatisfy { abs($0 - decoded[0]) < 0.002 }
        let atStart = abs(decoded[0] - h.0) < 0.01
        print("      every sample decodes to the same frame: \(allSame)   and that frame is the held one: \(atStart)")
        if !(allSame && atStart) { failures += 1 }
    }
    for (name, tt) in stillArgs {
        let (img, actual) = try await gen.image(at: CMTime(seconds: tt, preferredTimescale: 600))
        save(img, outDir + "/" + prefix + name + ".png")
        print("  still \(name): asked \(String(format: "%.2f", tt))s, decoded \(String(format: "%.3f", actual.seconds))s -> \(prefix)\(name).png")
    }
    // the loop seam: first frame against the last
    let (firstImg, ft) = try await gen.image(at: .zero)
    let lastT = max(0, dur.seconds - 0.02)
    let (lastImg, lt) = try await gen.image(at: CMTime(seconds: lastT, preferredTimescale: 600))
    save(firstImg, outDir + "/" + prefix + "seam-first.png")
    save(lastImg, outDir + "/" + prefix + "seam-last.png")
    print("  loop seam: first frame at \(String(format: "%.3f", ft.seconds))s, last frame at \(String(format: "%.3f", lt.seconds))s (asked \(String(format: "%.3f", lastT))s)")
    print(failures == 0 ? "  HOLD VERIFICATION PASSED" : "  HOLD VERIFICATION FAILED (\(failures))")
    sem.signal()
}
sem.wait()
exit(failures == 0 ? 0 : 1)
