// Reads the real sample timing with AVAssetReader, so a tail that exists only
// as a later endSession shows up as a short stream rather than a rest.
//
// Two passes, because they can disagree and the decoded one is authoritative:
//   A. decompressed output: one buffer per frame, in PRESENTATION order, with
//      the timing the decoder will actually use.
//   B. passthrough output: the coded samples in DECODE order. A buffer may hold
//      several samples under a single timing entry, in which case sample k sits
//      at pts + k * duration.
//
// usage: swift samples.swift <mp4> [<mp4> ...]
import Foundation
import AVFoundation
import CoreMedia

func timings(_ sb: CMSampleBuffer) -> [(Double, Double)] {
    let n = CMSampleBufferGetNumSamples(sb)
    if n == 0 { return [] }
    var count = 0
    CMSampleBufferGetSampleTimingInfoArray(sb, entryCount: 0, arrayToFill: nil, entriesNeededOut: &count)
    guard count > 0 else { return [] }
    var infos = [CMSampleTimingInfo](repeating: CMSampleTimingInfo(), count: count)
    CMSampleBufferGetSampleTimingInfoArray(sb, entryCount: count, arrayToFill: &infos, entriesNeededOut: &count)
    var out: [(Double, Double)] = []
    for k in 0..<n {
        if count == 1 {
            let i = infos[0]
            guard i.presentationTimeStamp.isValid else { continue }
            let d = i.duration.isValid && !i.duration.isIndefinite ? i.duration.seconds : Double.nan
            // one timing entry describing every sample: they are evenly spaced
            let p = i.presentationTimeStamp.seconds + (d.isNaN ? 0 : d * Double(k))
            out.append((p, d))
        } else {
            let i = infos[min(k, count - 1)]
            guard i.presentationTimeStamp.isValid else { continue }
            let d = i.duration.isValid && !i.duration.isIndefinite ? i.duration.seconds : Double.nan
            out.append((i.presentationTimeStamp.seconds, d))
        }
    }
    return out
}

func read(_ asset: AVURLAsset, _ track: AVAssetTrack, decompress: Bool) throws -> [(Double, Double)] {
    let reader = try AVAssetReader(asset: asset)
    let settings: [String: Any]? = decompress
        ? [kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA)] : nil
    let out = AVAssetReaderTrackOutput(track: track, outputSettings: settings)
    out.alwaysCopiesSampleData = false
    reader.add(out)
    reader.startReading()
    var rows: [(Double, Double)] = []
    while let sb = out.copyNextSampleBuffer() { rows.append(contentsOf: timings(sb)) }
    if reader.status == .failed { print("     reader failed: \(String(describing: reader.error))") }
    return rows
}

let sem = DispatchSemaphore(value: 0)
Task {
    for path in CommandLine.arguments.dropFirst() {
        let asset = AVURLAsset(url: URL(fileURLWithPath: path))
        let dur = try await asset.load(.duration)
        guard let track = try await asset.loadTracks(withMediaType: .video).first else { fatalError("no track") }
        let tr = try await track.load(.timeRange)
        print("  \((path as NSString).lastPathComponent)")
        print("     asset duration: \(String(format: "%.4f", dur.seconds))s")
        print("     track timeRange: start \(String(format: "%.4f", tr.start.seconds))s  duration \(String(format: "%.4f", tr.duration.seconds))s  end \(String(format: "%.4f", tr.end.seconds))s")
        for (label, decomp) in [("decoded, presentation order", true), ("coded passthrough, decode order", false)] {
            var rows = try read(asset, track, decompress: decomp)
            if !decomp { rows.sort { $0.0 < $1.0 } }
            print("     --- \(label): \(rows.count) samples")
            let n = rows.count
            for i in max(0, n-3)..<n {
                let d = rows[i].1
                // decompressed buffers carry no duration, so the time the frame is
                // actually on screen is the gap to the next sample, or to the end
                // of the track for the last one. That is the number that matters.
                let onScreen = (i + 1 < n) ? rows[i+1].0 - rows[i].0 : tr.end.seconds - rows[i].0
                print("        sample \(i): pts \(String(format: "%.4f", rows[i].0))s  sample duration \(d.isNaN ? "not carried" : String(format: "%.4f", d) + "s")  on screen \(String(format: "%.4f", onScreen))s")
            }
            if let last = rows.last {
                let covered = last.0 + (last.1.isNaN ? 0 : last.1)
                print("        final sample ends at \(String(format: "%.4f", covered))s   shortfall vs asset duration: \(String(format: "%.4f", dur.seconds - covered))s")
            }
        }
    }
    sem.signal()
}
sem.wait()
