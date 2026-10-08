using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public class CrispUpscaler8K {
    public static void Main(string[] args) {
        string srcPath = @"C:\Users\Knauf\.gemini\antigravity\brain\81a184f6-7fc7-4521-969e-28720e21da27\.user_uploaded\media_1790928534833.png";
        string outDir = @"C:\Users\Knauf\Documents\GitHub\crowdbeats-v2\apps\web\public";

        Console.WriteLine("Loading source: " + srcPath);
        using (Bitmap rawSrc = new Bitmap(srcPath)) {
            int srcW = rawSrc.Width;
            int srcH = rawSrc.Height;

            // 1. Detect Phone Content Bounds
            int minX = srcW, maxX = 0, minY = srcH, maxY = 0;
            for (int y = 0; y < srcH; y++) {
                for (int x = 0; x < srcW; x++) {
                    Color c = rawSrc.GetPixel(x, y);
                    if (c.R < 250 || c.G < 250 || c.B < 250) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            // Balanced breathing padding around the phones
            int padX = 14;
            int padY = 10;
            int cropX = Math.Max(0, minX - padX);
            int cropY = Math.Max(0, minY - padY);
            int cropW = Math.Min(srcW - cropX, (maxX - minX + 1) + padX * 2);
            int cropH = Math.Min(srcH - cropY, (maxY - minY + 1) + padY * 2);

            Console.WriteLine(string.Format("Cropping phone region: {0}x{1} from ({2},{3})", cropW, cropH, cropX, cropY));

            // Extract cropped source and clean pure white background
            Bitmap cleanCropped = new Bitmap(cropW, cropH, PixelFormat.Format32bppArgb);
            using (Graphics g = Graphics.FromImage(cleanCropped)) {
                g.Clear(Color.White);
                g.DrawImage(rawSrc, new Rectangle(0, 0, cropW, cropH), cropX, cropY, cropW, cropH, GraphicsUnit.Pixel);
            }

            // Denoise flat areas while preserving edges
            Bitmap denoised = EdgePreservingDenoise(cleanCropped);
            cleanCropped.Dispose();

            // 2. Stepped Super-Resolution to 8K (7680 px wide)
            // Step 1: to 2048
            int w1 = 2048;
            int h1 = (int)Math.Round((double)cropH * w1 / cropW);
            Console.WriteLine(string.Format("Super-resolution Step 1: {0}x{1}", w1, h1));
            Bitmap step1 = ResizeBicubic(denoised, w1, h1);
            denoised.Dispose();
            Bitmap sharp1 = UnsharpMask(step1, 0.45f, 2);
            step1.Dispose();

            // Step 2: to 4096
            int w2 = 4096;
            int h2 = (int)Math.Round((double)cropH * w2 / cropW);
            Console.WriteLine(string.Format("Super-resolution Step 2: {0}x{1}", w2, h2));
            Bitmap step2 = ResizeBicubic(sharp1, w2, h2);
            sharp1.Dispose();
            Bitmap sharp2 = UnsharpMask(step2, 0.55f, 2);
            step2.Dispose();

            // Step 3: to 7680 (Full 8K Master)
            int w8k = 7680;
            int h8k = (int)Math.Round((double)cropH * w8k / cropW);
            Console.WriteLine(string.Format("Super-resolution Step 3 (8K Master): {0}x{1}", w8k, h8k));
            Bitmap step3 = ResizeBicubic(sharp2, w8k, h8k);
            sharp2.Dispose();

            // Final crisp edge enhancement on 8K
            Bitmap final8k = UnsharpMask(step3, 0.65f, 3);
            step3.Dispose();

            // Ensure background border pixels are pure clean white
            CleanWhiteBackground(final8k);

            // Save 8K PNG (100% Lossless, No Compression Grain)
            string pngPath = Path.Combine(outDir, "crowdbeats_mockups_8k.png");
            final8k.Save(pngPath, ImageFormat.Png);
            Console.WriteLine("Saved crisp 8K PNG: " + pngPath);

            // Save 8K JPG at 98% quality
            ImageCodecInfo jpgEncoder = GetEncoder(ImageFormat.Jpeg);
            EncoderParameters encParams = new EncoderParameters(1);
            encParams.Param[0] = new EncoderParameter(Encoder.Quality, 98L);
            string jpgPath = Path.Combine(outDir, "crowdbeats_mockups_8k.jpg");
            final8k.Save(jpgPath, jpgEncoder, encParams);
            Console.WriteLine("Saved crisp 8K JPG: " + jpgPath);

            // Also save 4K version (3840 wide) for devices that request 4K
            int w4k = 3840;
            int h4k = (int)Math.Round((double)cropH * w4k / cropW);
            Bitmap final4k = ResizeBicubic(final8k, w4k, h4k);
            string png4kPath = Path.Combine(outDir, "crowdbeats_mockups_4k.png");
            final4k.Save(png4kPath, ImageFormat.Png);
            string jpg4kPath = Path.Combine(outDir, "crowdbeats_mockups_4k.jpg");
            final4k.Save(jpg4kPath, jpgEncoder, encParams);
            Console.WriteLine("Saved crisp 4K PNG & JPG: " + png4kPath);

            final4k.Dispose();
            final8k.Dispose();
            Console.WriteLine("--- 8K Super-Resolution Complete ---");
        }
    }

    private static Bitmap ResizeBicubic(Bitmap src, int width, int height) {
        Bitmap dest = new Bitmap(width, height, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(dest)) {
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.Clear(Color.White);
            g.DrawImage(src, new Rectangle(0, 0, width, height), 0, 0, src.Width, src.Height, GraphicsUnit.Pixel);
        }
        return dest;
    }

    // Edge-preserving bilateral/range denoiser
    private static Bitmap EdgePreservingDenoise(Bitmap src) {
        int w = src.Width;
        int h = src.Height;
        Bitmap result = new Bitmap(w, h, PixelFormat.Format32bppArgb);

        BitmapData srcData = src.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        BitmapData dstData = result.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

        unsafe {
            byte* srcPtr = (byte*)srcData.Scan0;
            byte* dstPtr = (byte*)dstData.Scan0;
            int stride = srcData.Stride;

            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    int idx = y * stride + x * 4;
                    byte b0 = srcPtr[idx];
                    byte g0 = srcPtr[idx + 1];
                    byte r0 = srcPtr[idx + 2];
                    byte a0 = srcPtr[idx + 3];

                    // If pixel is near-white background, clamp directly to solid white
                    if (r0 >= 248 && g0 >= 248 && b0 >= 248) {
                        dstPtr[idx] = 255;
                        dstPtr[idx + 1] = 255;
                        dstPtr[idx + 2] = 255;
                        dstPtr[idx + 3] = 255;
                        continue;
                    }

                    // For content pixels: bilateral filter with 3x3 window
                    float totalWeight = 0;
                    float accB = 0, accG = 0, accR = 0;

                    for (int dy = -1; dy <= 1; dy++) {
                        int ny = y + dy;
                        if (ny < 0 || ny >= h) continue;

                        for (int dx = -1; dx <= 1; dx++) {
                            int nx = x + dx;
                            if (nx < 0 || nx >= w) continue;

                            int nidx = ny * stride + nx * 4;
                            byte nb = srcPtr[nidx];
                            byte ng = srcPtr[nidx + 1];
                            byte nr = srcPtr[nidx + 2];

                            // Color difference
                            int diff = Math.Abs(r0 - nr) + Math.Abs(g0 - ng) + Math.Abs(b0 - nb);

                            // Spatial distance
                            float spatialDistSq = dx * dx + dy * dy;

                            // Edge-preserving range weight: sharp falloff if color diff > 32
                            float rangeWeight = (float)Math.Exp(-(diff * diff) / (2.0f * 18.0f * 18.0f));
                            float spatialWeight = (float)Math.Exp(-spatialDistSq / 2.0f);
                            float wgt = rangeWeight * spatialWeight;

                            accB += nb * wgt;
                            accG += ng * wgt;
                            accR += nr * wgt;
                            totalWeight += wgt;
                        }
                    }

                    if (totalWeight > 0.0001f) {
                        dstPtr[idx] = (byte)Math.Min(255, Math.Max(0, accB / totalWeight));
                        dstPtr[idx + 1] = (byte)Math.Min(255, Math.Max(0, accG / totalWeight));
                        dstPtr[idx + 2] = (byte)Math.Min(255, Math.Max(0, accR / totalWeight));
                        dstPtr[idx + 3] = a0;
                    } else {
                        dstPtr[idx] = b0;
                        dstPtr[idx + 1] = g0;
                        dstPtr[idx + 2] = r0;
                        dstPtr[idx + 3] = a0;
                    }
                }
            }
        }

        src.UnlockBits(srcData);
        result.UnlockBits(dstData);
        return result;
    }

    // High-performance unsharp mask (box blur difference)
    private static Bitmap UnsharpMask(Bitmap src, float amount, int radius) {
        int w = src.Width;
        int h = src.Height;

        Bitmap blurred = new Bitmap(w, h, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(blurred)) {
            // Quick down/up box approximation of Gaussian blur
            int smallW = Math.Max(1, w / (radius * 2));
            int smallH = Math.Max(1, h / (radius * 2));
            using (Bitmap small = new Bitmap(smallW, smallH, PixelFormat.Format32bppArgb)) {
                using (Graphics gSmall = Graphics.FromImage(small)) {
                    gSmall.InterpolationMode = InterpolationMode.Bilinear;
                    gSmall.DrawImage(src, 0, 0, smallW, smallH);
                }
                g.InterpolationMode = InterpolationMode.Bilinear;
                g.DrawImage(small, 0, 0, w, h);
            }
        }

        Bitmap sharpened = new Bitmap(w, h, PixelFormat.Format32bppArgb);

        BitmapData srcData = src.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        BitmapData blurData = blurred.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        BitmapData dstData = sharpened.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

        unsafe {
            byte* srcPtr = (byte*)srcData.Scan0;
            byte* blurPtr = (byte*)blurData.Scan0;
            byte* dstPtr = (byte*)dstData.Scan0;
            int stride = srcData.Stride;

            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    int idx = y * stride + x * 4;

                    for (int c = 0; c < 3; c++) {
                        int orig = srcPtr[idx + c];
                        int blur = blurPtr[idx + c];
                        int diff = orig - blur;

                        // Only sharpen when diff exceeds subtle noise threshold (prevents grain amplification)
                        if (Math.Abs(diff) > 2) {
                            int sharp = (int)(orig + amount * diff);
                            dstPtr[idx + c] = (byte)Math.Min(255, Math.Max(0, sharp));
                        } else {
                            dstPtr[idx + c] = (byte)orig;
                        }
                    }
                    dstPtr[idx + 3] = srcPtr[idx + 3];
                }
            }
        }

        src.UnlockBits(srcData);
        blurred.UnlockBits(blurData);
        sharpened.UnlockBits(dstData);
        blurred.Dispose();

        return sharpened;
    }

    private static void CleanWhiteBackground(Bitmap bmp) {
        int w = bmp.Width;
        int h = bmp.Height;
        BitmapData data = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);

        unsafe {
            byte* ptr = (byte*)data.Scan0;
            int stride = data.Stride;

            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    int idx = y * stride + x * 4;
                    byte b = ptr[idx];
                    byte g = ptr[idx + 1];
                    byte r = ptr[idx + 2];

                    if (r >= 250 && g >= 250 && b >= 250) {
                        ptr[idx] = 255;
                        ptr[idx + 1] = 255;
                        ptr[idx + 2] = 255;
                    }
                }
            }
        }

        bmp.UnlockBits(data);
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
