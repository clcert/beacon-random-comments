
# Beacon Random Comments Tutorial de verificación

Este tutorial tiene como propósito ser una guía de cómo verificar un 
sorteo realizado tras utilizar nuestra extensión. Si llegaste hasta aquí
asumimos que ya realizaste un sorteo y posees un link a una página de
verificación, como la que se puede apreciar a continuación:


## 1. Descarga de archivos de verificación

En caso de tener dicho link, por favor dirigirse a la página de 
verificación del sorteo y descargar el zip que contiene los archivos que
utilizaremos. Una vez descargado el archivo, descomprímalo, debiera
hallar dos archivos:

```
verification
    ├ verify.py
    └ draw.json
```

En caso de no tener dicho link, en este tutorial se provee un zip de un
sorteo realizado anteriormente ([descargar aquí](#)), puede utilizar estos archivos para
testear el script de verificación.


## 2. Uso del script de verificación

Para utilizar el script de verificación debe haber instalado previamente
Python 3. Puede descargar la última versión haciendo click [aquí](https://www.python.org/downloads/).

Una vez seguro de tener Python 3 instalado (el script fue testeado con 
la versión 3.7), puede encontrar una descripción de uso del mismo al 
escribir en su línea de comandos:

```bash
python verify.py -h
```

Podrá apreciar que este script recibe un nombre de archivo en formato 
JSON como parámetro. Por defecto, se asume que dicho archivo se llama 
`draw.json`. Si su archivo representante del sorteo posee dicho nombre, 
para ejecutar el script basta con ejecutar:

```bash
python verify.py
```

Sino, supongamos que su archivo se llama `miarchivo.json`. En este caso
debe colocar al final la flag `-f` seguida del nombre del archivo, 
quedando el comando como sigue:

```bash
python verify.py -f miarchivo.json
```

Finalmente, si la información de la simulación calza con la información
del archivo, se mostrará el mensaje _"The verification was successful"_.
En caso de fallar se mostrará _"The verification was unsuccessful"_.