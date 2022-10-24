@echo off
:BEGIN
CLS

SET db=bookswap
:: users

SET import="%MONGO%\mongoimport.exe"
SET export="%MONGO%\mongoexport.exe"
SET local="mongodb://localhost:27017/%db%"

ECHO 1.Import
ECHO 2.Export
CHOICE /N /C:12 /M "Enter your choice:"%1
IF ERRORLEVEL ==2 GOTO EXPORT
IF ERRORLEVEL ==1 GOTO IMPORT

:IMPORT
SET /P AREYOUSURE=Are you sure (Y/[N])?
IF /I "%AREYOUSURE%" NEQ "Y" GOTO END
ECHO ---------- Importing to the local database ----------
%import% --uri=%local%  --collection=users --drop --file=users.json --jsonArray
GOTO END

:EXPORT
SET /P AREYOUSURE=Are you sure (Y/[N])?
IF /I "%AREYOUSURE%" NEQ "Y" GOTO END
ECHO ---------- Exporting from the local database ----------
%export% --uri=%local% --collection=users --out=users.json --jsonArray --pretty
GOTO END

:END
pause