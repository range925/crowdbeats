using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public class MockupProcessor4K {
    public static void Main(string[] args) {
        string srcPath = @"C:\Users\Knauf\.gemini\antigravity\brain\81a184f6-7fc7-4521-969e-28720e21da27\.user_uploaded\media_1790928534833.png";
        string outDir = @"C:\Users\Knauf\Documents\GitHub\crowdbeats-v2\apps\web\public";

        using (Bitmap src = new Bitmap(srcPath)) {
            int srcW = src.Width;
            int srcH = src.Height;

            int minX = srcW;
            int maxX = 0;
            int minY = srcH;
            int maxY = 0;

            for (int y = 0; y < srcH; y++) {
                for (int x = 0; x < srcW; x++) {
                    Color c = src.GetPixel(x, y);
                    if (c.R < 250 || c.G < 250 || c.B < 250) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            Console.WriteLine(string.Format("Raw Image: {0}x{1}", srcW, srcH));
            Console.WriteLine(string.Format("Phone Content Bounds: X=[{0}..{1}], Y=[{2}..{3}]", minX, maxX, minY, maxY));
            int contentW = maxX - minX + 1;
            int contentH = maxY - minY + 1;
            Console.WriteLine(string.Format("Phone Content Size: {0}x{1}", contentW, contentH));

            // Add slight breathing margin (e.g. 10px on source)
            int padX = 12;
            int padY = 8;
            int cropX = Math.Max(0, minX - padX);
            int cropY = Math.Max(0, minY - padY);
            int cropW = Math.Min(srcW - cropX, contentW + padX * 2);
            int cropH = Math.Min(srcH - cropY, contentH + padY * 2);

            Console.WriteLine(string.Format("Cropped region for maximal size: X={0}, Y={1}, W={2}, H={3}", cropX, cropY, cropW, cropH));

            // Generate 4K (3840 px wide) focused on the phones
            int target4kW = 3840;
            int target4kH = (int)Math.Round((double)cropH * target4kW / cropW);

            Console.WriteLine(string.Format("Generating 4K Master: {0}x{1}", target4kW, target4kH));

            using (Bitmap bmp4k = new Bitmap(target4kW, target4kH, PixelFormat.Format32bppArgb)) {
                using (Graphics g = Graphics.FromImage(bmp4k)) {
                    g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    g.SmoothingMode = SmoothingMode.HighQuality;
                    g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                    g.CompositingQuality = CompositingQuality.HighQuality;
                    g.Clear(Color.White);
                    g.DrawImage(src, new Rectangle(0, 0, target4kW, target4kH), cropX, cropY, cropW, cropH, GraphicsUnit.Pixel);
                }

                // Save PNG (Lossless 4K)
                string pngPath = Path.Combine(outDir, "crowdbeats_mockups_4k.png");
                bmp4k.Save(pngPath, ImageFormat.Png);
                Console.WriteLine("Saved 4K PNG: " + pngPath);

                // Save JPG (Optimized 4K, 95% quality)
                ImageCodecInfo jpgEncoder = GetEncoder(ImageFormat.Jpeg);
                EncoderParameters encParams = new EncoderParameters(1);
                encParams.Param[0] = new EncoderParameter(Encoder.Quality, 95L);

                string jpgPath = Path.Combine(outDir, "crowdbeats_mockups_4k.jpg");
                bmp4k.Save(jpgPath, jpgEncoder, encParams);
                Console.WriteLine("Saved 4K JPG: " + jpgPath);
            }
        }
    }

    private static ImageCodecInfo GetEncoder(ImageFormat format) {
        ImageCodecInfo[] codecs = ImageCodecInfo.GetImageDecoders();
        foreach (ImageCodecInfo codec in codecs) {
            if (codec.FormatID == format.Guid) {
                return codec;
            }
        }
        return null;
    }
}
