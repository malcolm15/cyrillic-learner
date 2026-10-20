import Foundation
import CoreGraphics
import ImageIO
func load(_ p: String) -> CGImage {
    guard let s = CGImageSourceCreateWithURL(URL(fileURLWithPath: p) as CFURL, nil),
          let i = CGImageSourceCreateImageAtIndex(s, 0, nil) else { fatalError("cannot read \(p)") }
    return i
}
func pixels(_ img: CGImage) -> ([UInt8], Int, Int) {
    let w = img.width, h = img.height
    var buf = [UInt8](repeating: 0, count: w*h*4)
    buf.withUnsafeMutableBytes { raw in
        let ctx = CGContext(data: raw.baseAddress, width: w, height: h, bitsPerComponent: 8,
            bytesPerRow: w*4, space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
    }
    return (buf, w, h)
}
let a = load(CommandLine.arguments[1]), b = load(CommandLine.arguments[2])
let (pa, w, h) = pixels(a), (pb, w2, h2) = pixels(b)
guard w == w2 && h == h2 else { print("  different dimensions: \(w)x\(h) vs \(w2)x\(h2)"); exit(0) }
var minX = w, minY = h, maxX = -1, maxY = -1, count = 0, maxDelta = 0
for y in 0..<h { for x in 0..<w {
    let i = (y*w + x)*4
    let d = max(abs(Int(pa[i])-Int(pb[i])), max(abs(Int(pa[i+1])-Int(pb[i+1])), abs(Int(pa[i+2])-Int(pb[i+2]))))
    if d > 2 { count += 1; maxDelta = max(maxDelta, d)
        minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y) }
} }
print("  size: \(w)x\(h)   differing pixels (delta>2): \(count)   max channel delta: \(maxDelta)")
if count > 0 { print("  difference bounding box in crop coords: x \(minX)..\(maxX)  y \(minY)..\(maxY)  (\(maxX-minX+1)x\(maxY-minY+1))") }
else { print("  visually identical") }

// extra statistics: how different are the two frames on average, not just at worst
var sum = 0, sq = 0.0, over8 = 0, over24 = 0
for y in 0..<h { for x in 0..<w {
    let i = (y*w + x)*4
    for ch in 0..<3 {
        let d = abs(Int(pa[i+ch]) - Int(pb[i+ch]))
        sum += d; sq += Double(d*d)
    }
    let dm = max(abs(Int(pa[i])-Int(pb[i])), max(abs(Int(pa[i+1])-Int(pb[i+1])), abs(Int(pa[i+2])-Int(pb[i+2]))))
    if dm > 8 { over8 += 1 }
    if dm > 24 { over24 += 1 }
} }
let npx = w*h
print("  mean channel delta: \(String(format: "%.3f", Double(sum)/Double(npx*3)))   pixels over 8: \(over8) (\(String(format: "%.2f", 100.0*Double(over8)/Double(npx)))%)   over 24: \(over24) (\(String(format: "%.3f", 100.0*Double(over24)/Double(npx)))%)")
let mse = sq/Double(npx*3)
print("  PSNR: \(mse > 0 ? String(format: "%.1f", 10*log10(255*255/mse)) : "infinite") dB")
