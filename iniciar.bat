@echo off
chcp 65001 > nul
title MedConcursos - Vagas para Médico & Distância de Divinópolis MG
echo ===================================================================
echo     MedConcursos - Vagas de Médico com Distância de Divinópolis
echo ===================================================================
echo.
echo Iniciando o servidor em http://localhost:8000 ...
timeout /t 2 /nobreak > nul
start http://localhost:8000
python main.py
pause

