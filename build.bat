@echo off
set ex_filename="persistent-video-volume.zip"
set seven_zip="C:\Program Files\7-Zip\7z.exe"

:main
cd /D %~dp0
del %ex_filename%
%seven_zip% a %ex_filename% .\src\* -r -tzip
