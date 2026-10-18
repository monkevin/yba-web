@echo off
chcp 65001 >nul
title Web YBA Cho Lon - dang chay (KHONG dong cua so nay)

set "NODE_DIR=C:\Program Files\nodejs"
set "PATH=%NODE_DIR%;%PATH%"
set "PORT=3002"
cd /d "%~dp0"

echo.
echo   ============================================================
echo      WEBSITE YBA CHO LON - ybacholon.vn
echo   ============================================================
echo.

if not exist "node_modules" (
  echo   Lan dau chay: dang cai dat, doi khoang 2-3 phut...
  call npm ci
)

rem So sanh: neu co file ma nguon / anh moi hon ban build thi build lai.
rem Nho vay moi thay doi (logo moi, giao dien moi) luon xuat hien khi mo web.
set "CAN_BUILD=1"
if exist ".next\BUILD_ID" (
  rem Bo qua CSDL (dev.db doi lien tuc khi co nguoi dung) va anh tai len (public/tai-len) - hai thu nay khong can build lai.
  powershell -NoProfile -Command "$b=(Get-Item '.next\BUILD_ID').LastWriteTime; $m=Get-ChildItem src,public,prisma -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike '*.db*' -and $_.FullName -notlike '*tai-len*' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1; if($m -and $m.LastWriteTime -gt $b){exit 1}else{exit 0}"
  if not errorlevel 1 set "CAN_BUILD=0"
)

rem Dung ban dang chay (neu co) TRUOC khi build.
rem Ly do: moi lan build lai, ten file giao dien (CSS) doi khac. Ban cu van con
rem chay se tro toi ten file da bi xoa -> trang mat sach dinh dang, chu tran.
rem Dung truoc thi khong bao gio gap chuyen do.
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:"TCP .*:%PORT% .*LISTENING"') do (
  echo   Dang dung ban web cu de thay bang ban moi...
  taskkill /PID %%p /F >nul 2>&1
)

if "%CAN_BUILD%"=="1" (
  echo   Co ban cap nhat moi: dang chuan bi, doi khoang 1-2 phut...
  call npm run build
) else (
  echo   Khong co gi moi, dung ban da chuan bi san.
)

echo.
echo   Dang khoi dong... Trinh duyet se tu mo sau vai giay.
echo.
echo   Trang chu:        http://localhost:%PORT%
echo   Khu hoi vien:     http://localhost:%PORT%/login
echo   Dang nhap:        bang tai khoan hoi vien cua anh (quan tri: admin)
echo.
echo   * De DUNG web: dong cua so mau den nay lai.
echo.

start "" cmd /c "timeout /t 6 >nul & start http://localhost:%PORT%"

call npm run start

echo.
echo   Web da dung. Bam phim bat ky de dong.
pause >nul
