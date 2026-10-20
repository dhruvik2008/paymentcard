Add-Type -AssemblyName System.Drawing

$srcPath = "d:\Website\Card\hanuman.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

function GenerateAppIcon($srcImg, $cropY, $size, $outPath) {
    $cropSize = 458
    $tempBmp = New-Object System.Drawing.Bitmap($cropSize, $cropSize)
    $gTemp = [System.Drawing.Graphics]::FromImage($tempBmp)
    $gTemp.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gTemp.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gTemp.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    $srcRect = New-Object System.Drawing.Rectangle(0, $cropY, $cropSize, $cropSize)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $cropSize, $cropSize)
    $gTemp.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    
    # Watermark is at X: 345..452, Y: 94..108 (in crop coordinates with cropY=160)
    # Sample dark stone area from X: 345..452, Y: 68..90 and draw over watermark
    $sampleRect = New-Object System.Drawing.Rectangle(345, 68, 108, 24)
    $watermarkRect = New-Object System.Drawing.Rectangle(345, 93, 108, 24)
    $gTemp.DrawImage($tempBmp, $watermarkRect, $sampleRect, [System.Drawing.GraphicsUnit]::Pixel)
    $gTemp.Dispose()
    
    # Target size bitmap
    $finalBmp = New-Object System.Drawing.Bitmap($size, $size)
    $gFinal = [System.Drawing.Graphics]::FromImage($finalBmp)
    $gFinal.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gFinal.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gFinal.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    $gFinal.DrawImage($tempBmp, 0, 0, $size, $size)
    $gFinal.Dispose()
    $tempBmp.Dispose()
    
    $finalBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $finalBmp.Dispose()
    Write-Output "Successfully generated $outPath ($size x $size)"
}

GenerateAppIcon $src 160 512 "d:\Website\Card\icon-512.png"
GenerateAppIcon $src 160 192 "d:\Website\Card\icon-192.png"
GenerateAppIcon $src 160 180 "d:\Website\Card\apple-touch-icon.png"

$src.Dispose()
