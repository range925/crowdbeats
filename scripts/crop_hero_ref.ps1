Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\Knauf\.gemini\antigravity\brain\b53da591-658a-4260-88cc-df5722411675\.user_uploaded\media_1791322335673.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Width: $($bmp.Width), Height: $($bmp.Height)"
$cropH = [int]($bmp.Height * 0.12)
$rect = New-Object System.Drawing.Rectangle(0, 0, $bmp.Width, $cropH)
$cropped = $bmp.Clone($rect, $bmp.PixelFormat)
$outPath = "C:\Users\Knauf\.gemini\antigravity\brain\b53da591-658a-4260-88cc-df5722411675\hero_reference_cropped.png"
$cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$cropped.Dispose()
Write-Host "Cropped hero saved successfully to $outPath"
