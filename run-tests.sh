#!/bin/bash
# run-tests.sh — testy jednostkowe MineWeb (bez zależności; wbudowany runner Node).
# Kod wyjścia = wynik testów (0 = OK). Wywoływane też przez ~/deploy/deploy.sh przed wdrożeniem.
cd "$(dirname "$0")" || exit 2
exec node --test tests/
