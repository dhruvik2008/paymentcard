Add-Type -AssemblyName System.Drawing

function TestMasks($imgPath, $outSquircle, $outCircle) {
    $src = [System.Drawing.Bitmap]::FromFile($imgPath)
    $size = $src.Width
    
    # 1. Squircle (iOS rounded rect ~22% radius)
    $bmpSquircle = New-Object System.Drawing.Bitmap($size, $size)
    $g1 = [System.Drawing.Graphics]::FromImage($bmpSquircle)
    $g1.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g1.Clear([System.Drawing.Color]::Transparent)
    
    $radius = [int]($size * 0.22)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $radius * 2, $radius * 2, 180, 90)
    $path.AddArc($size - $radius * 2, 0, $radius * 2, $radius * 2, 270, 90)
    $path.AddArc($size - $radius * 2, $size - $radius * 2, $radius * 2, $radius * 2, 0, 90)
    $path.AddArc(0, $size - $radius * 2, $radius * 2, $radius * 2, 90, 90)
    $path.CloseFigure()
    
    $g1.SetClip($path)
    $g1.DrawImage($src, 0, 0, $size, $size)
    $g1.Dispose()
    $bmpSquircle.Save($outSquircle, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpSquircle.Dispose()
    
    # 2. Circle (Android circle mask)
    $bmpCircle = New-Object System.Drawing.Bitmap($size, $size)
    $g2 = [System.Drawing.Graphics]::FromImage($bmpCircle)
    $g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g2.Clear([System.Drawing.Color]::Transparent)
    
    $cpath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $cpath.AddEllipse(0, 0, $size, $size)
    $g2.SetClip($cpath)
    $g2.DrawImage($src, 0, 0, $size, $size)
    $g2.Dispose()
    $bmpCircle.Save($outCircle, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpCircle.Dispose()
    
    $src.Dispose()
    Write-Output "Done masks"
}

TestMasks "d:\Website\Card\icon_crop_higher_512.png" "d:\Website\Card\mask_squircle.png" "d:\Website\Card\mask_circle.png"
