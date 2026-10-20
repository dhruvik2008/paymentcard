Add-Type -AssemblyName System.Drawing

$srcPath = "d:\Website\Card\hanuman.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

function MakeSquareCrop($srcImg, $cropY, $size, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Background dark color from arch
    $bgColor = [System.Drawing.Color]::FromArgb(255, 17, 24, 39)
    $g.Clear($bgColor)
    
    $srcRect = New-Object System.Drawing.Rectangle(0, $cropY, 458, 458)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    
    $g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Saved $outPath"
}

function MakeFitted($srcImg, $size, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Background dark color from image background
    $bgColor = [System.Drawing.Color]::FromArgb(255, 18, 18, 20)
    $g.Clear($bgColor)
    
    # Fit full height into $size
    $scale = $size / $srcImg.Height
    $destW = [int]($srcImg.Width * $scale)
    $destH = $size
    $destX = [int](($size - $destW) / 2)
    $destY = 0
    
    $srcRect = New-Object System.Drawing.Rectangle(0, 0, $srcImg.Width, $srcImg.Height)
    $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)
    
    $g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Saved $outPath"
}

# Generate both for review
MakeSquareCrop $src 210 512 "d:\Website\Card\icon_crop_512.png"
MakeSquareCrop $src 180 512 "d:\Website\Card\icon_crop_higher_512.png"
MakeFitted $src 512 "d:\Website\Card\icon_fitted_512.png"

$src.Dispose()
