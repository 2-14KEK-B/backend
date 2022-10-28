@echo off
:BEGIN
CLS

SET db=bookswap
:: users, borrows, books, messages

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
%import% --uri=%local%  --collection=borrows --drop --file=borrows.json --jsonArray
%import% --uri=%local%  --collection=books --drop --file=books.json --jsonArray
%import% --uri=%local%  --collection=messages --drop --file=messages.json --jsonArray
GOTO END

:EXPORT
SET /P AREYOUSURE=Are you sure (Y/[N])?
IF /I "%AREYOUSURE%" NEQ "Y" GOTO END
ECHO ---------- Exporting from the local database ----------
%export% --uri=%local% --collection=users --out=users.json --jsonArray --pretty
%export% --uri=%local% --collection=borrows --out=borrows.json --jsonArray --pretty
%export% --uri=%local% --collection=books --out=books.json --jsonArray --pretty
%export% --uri=%local% --collection=messages --out=messages.json --jsonArray --pretty
GOTO END

:END
pause