// Deterministic macOS/AppKit artwork; npm run assets. No downloaded imagery.
import AppKit

let output = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("public")
func rgb(_ r: Int, _ g: Int, _ b: Int) -> NSColor {
  NSColor(calibratedRed: CGFloat(r)/255, green: CGFloat(g)/255, blue: CGFloat(b)/255, alpha: 1)
}
let paper = rgb(244,242,235), ink = rgb(23,50,46), teal = rgb(40,107,98), pale = rgb(217,226,214)
func text(_ value: String, _ x: CGFloat, _ y: CGFloat, _ size: CGFloat, _ weight: NSFont.Weight, _ color: NSColor, _ kern: CGFloat = 0) {
  NSAttributedString(string: value, attributes: [.font: NSFont.systemFont(ofSize:size,weight:weight), .foregroundColor:color, .kern:kern]).draw(at:NSPoint(x:x,y:y))
}
func ellipse(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, _ color: NSColor) {
  color.setFill(); NSBezierPath(ovalIn:NSRect(x:x,y:y,width:w,height:h)).fill()
}
func line(_ pts: [(CGFloat,CGFloat)], _ width: CGFloat, _ color: NSColor) {
  let p=NSBezierPath(); p.move(to:NSPoint(x:pts[0].0,y:pts[0].1))
  for q in pts.dropFirst(){p.line(to:NSPoint(x:q.0,y:q.1))}
  p.lineWidth=width;p.lineCapStyle = .round;p.lineJoinStyle = .round;color.setStroke();p.stroke()
}
func polygon(_ pts: [(CGFloat,CGFloat)], _ color: NSColor) {
  let p=NSBezierPath();p.move(to:NSPoint(x:pts[0].0,y:pts[0].1))
  for q in pts.dropFirst(){p.line(to:NSPoint(x:q.0,y:q.1))}
  p.close();color.setFill();p.fill()
}
func png(_ w: Int, _ h: Int, _ name: String, _ draw: () -> Void) {
  let bitmap=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:w,pixelsHigh:h,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
  NSGraphicsContext.saveGraphicsState();let ctx=NSGraphicsContext(bitmapImageRep:bitmap)!;NSGraphicsContext.current=ctx;ctx.imageInterpolation = .high
  draw();ctx.flushGraphics();NSGraphicsContext.restoreGraphicsState()
  try! bitmap.representation(using:.png,properties:[:])!.write(to:output.appendingPathComponent(name))
}
// Minimal reaching figure, distinct from a standing strength-training body mark.
func mark(_ foreground: NSColor) {
  ellipse(29,43,10,11,foreground)
  line([(32,40),(29,30),(30,24)],7,foreground)
  line([(31,39),(20,45),(13,53)],5,foreground)
  line([(32,38),(44,35),(51,40)],5,foreground)
  line([(30,24),(22,16),(15,9)],6,foreground)
  line([(31,24),(37,15),(46,10)],6,foreground)
}
for size in [64,180] {
  png(size,size,size==64 ? "favicon-64.png" : "apple-touch-icon.png") {
    NSAffineTransform(transform:AffineTransform(scale:CGFloat(size)/64)).concat()
    paper.setFill();NSBezierPath(roundedRect:NSRect(x:0,y:0,width:64,height:64),xRadius:14,yRadius:14).fill()
    mark(teal)
  }
}
let svg="""
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#f4f2eb"/><g transform="translate(0 64) scale(1 -1)" fill="none" stroke="#286b62" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="34" cy="48.5" rx="5" ry="5.5" fill="#286b62" stroke="none"/><path d="M32 40 29 30 30 24" stroke-width="7"/><path d="M31 39 20 45 13 53M32 38 44 35 51 40" stroke-width="5"/><path d="M30 24 22 16 15 9M31 24 37 15 46 10" stroke-width="6"/></g></svg>
"""
try! svg.write(to:output.appendingPathComponent("favicon.svg"),atomically:true,encoding:.utf8)

png(1200,630,"social-preview.png") {
  paper.setFill();NSRect(x:0,y:0,width:1200,height:630).fill()
  // Airy map rings and a restrained anatomical motif, not an app screenshot.
  for r: CGFloat in [150,220,290] {
    let p=NSBezierPath(ovalIn:NSRect(x:892-r,y:316-r,width:2*r,height:2*r));p.lineWidth=1;rgb(207,216,202).setStroke();p.stroke()
  }
  line([(68,552),(1132,552)],1,rgb(207,216,202))
  line([(68,77),(1132,77)],1,rgb(207,216,202))
  text("A LITTLE SPACE TO MOVE",70,575,11,.medium,teal,2)
  text("FULL",63,348,102,.semibold,ink,-6)
  text("STRETCH",63,238,102,.semibold,ink,-6)
  line([(72,195),(122,195)],4,teal)
  text("Flexibility & Mobility",70,136,27,.regular,teal,-0.6)
  text("3D STRETCHING & MOBILITY TRACKER",70,44,11,.medium,teal,1.1)
  ellipse(868,463,50,65,ink)
  line([(891,470),(891,444)],28,ink)
  polygon([(837,438),(870,454),(913,454),(950,438),(940,386),(923,357),(921,298),(867,294),(859,358),(841,386)],ink)
  line([(842,424),(817,361),(803,296)],29,ink)
  line([(947,424),(973,361),(989,296)],29,ink)
  line([(880,291),(867,220),(858,128)],36,ink)
  line([(908,291),(922,220),(931,128)],36,ink)
  line([(857,121),(840,118)],21,ink);line([(931,121),(948,118)],21,ink)
  // Separated region contours communicate the body-map concept.
  ellipse(829,416,30,35,teal);ellipse(932,416,30,35,teal)
  polygon([(860,428),(887,440),(887,395),(864,389)],pale)
  polygon([(895,440),(923,428),(920,389),(895,395)],pale)
  polygon([(870,377),(887,386),(887,310),(873,307)],rgb(124,158,143))
  polygon([(895,386),(915,377),(914,307),(895,310)],rgb(124,158,143))
  line([(878,274),(868,226)],22,teal);line([(910,274),(921,226)],22,teal)
  line([(861,195),(858,153)],17,pale);line([(928,195),(932,153)],17,pale)
  for y: CGFloat in [369,350,331] {line([(872,y),(913,y)],1,ink)}
  ellipse(942,428,7,7,paper);line([(949,431),(1054,472)],1,teal);ellipse(1051,469,6,6,teal)
  ellipse(864,247,7,7,paper);line([(868,250),(765,198)],1,teal);ellipse(762,195,6,6,teal)
}
print("Generated SVG, 64/180 px icons, and 1200 × 630 social preview.")
