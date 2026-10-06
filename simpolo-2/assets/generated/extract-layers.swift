import AppKit

// Package the generated panorama using the visualizer's existing alpha masks.
let root = URL(fileURLWithPath: CommandLine.arguments[1])
func read(_ path: String) -> NSBitmapImageRep {
    let input = NSBitmapImageRep(data: try! Data(contentsOf: root.appendingPathComponent(path)))!
    let ctx = CGContext(data: nil, width: input.pixelsWide, height: input.pixelsHigh, bitsPerComponent: 8, bytesPerRow: input.pixelsWide * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.draw(input.cgImage!, in: CGRect(x: 0, y: 0, width: input.pixelsWide, height: input.pixelsHigh))
    return NSBitmapImageRep(cgImage: ctx.makeImage()!)
}
let earth = CommandLine.arguments.contains("earth")
let source = read(earth ? "assets/generated/simpolo-earth-graphite-panorama.png" : "assets/generated/simpolo-soft-marble-panorama.png")
assert(source.pixelsWide == 1779 && source.pixelsHigh == 884)
let materials = earth ? [("bathWall", "alchimia-leaf-raw"), ("floor", "alchimia-graphite-raw"), ("mirrorWall", "alchimia-hazel-raw")] : [("bathWall", "alps-dream"), ("floor", "belvedere-forest"), ("mirrorWall", "alchimia-pearl")]
for (surface, material) in materials {
    let maskName = surface == "mirrorWall" ? "mirrorWall-user" : surface
    let mask = read("assets/masks/\(maskName).png")
    let output = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 1779, pixelsHigh: 884, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bitmapFormat: .alphaNonpremultiplied, bytesPerRow: 0, bitsPerPixel: 0)!
    for y in 0..<884 {
        for x in 0..<1779 {
            var rgb = [Int](repeating: 0, count: 4)
            var maskPixel = [Int](repeating: 0, count: 4)
            source.getPixel(&rgb, atX: x, y: y)
            mask.getPixel(&maskPixel, atX: x, y: y)
            rgb[3] = maskPixel[3]
            output.setPixel(&rgb, atX: x, y: y)
        }
    }
    let outputName = surface == "mirrorWall" ? "\(surface)-\(material)-user-mask.png" : "\(surface)-\(material).png"
    let path = "assets/generated/\(outputName)"
    try! output.representation(using: .png, properties: [:])!.write(to: root.appendingPathComponent(path))
    print("Saved \(path): 1779 x 884")
}
