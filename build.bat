@echo off
set ex_filename="chrome-volume-persistence.zip"
set seven_zip="C:\Program Files\7-Zip\7z.exe"

cd /D %~dp0
del %ex_filename%
%seven_zip% a %ex_filename% .\src\* -r -tzip
