# Beacon Random UChile API

Este documento es una especie de guía sobre cómo utilizar la API de Random UChile para crear una aplicación que utiliza 
la aleatoriedad generada por el Beacon de Random UChile y poder verificar a posteriori la validez del proceso.


## LLamado a la API del Beacon de Random UChile

En esta aplicación en específico se utiliza la API de Random UChile para, a través de una consulta GET obtener un 
archivo de formato JSON que contiene un string de XXX bytes generado aleatoriamente. 

<p align="center">
    <img alt="API Random Uchile" src="img/api-call.png"/>
</p>

Se presenta continuación un ejemplo de consultas para obtener dicho JSON.

Javascript
```javascript
function handleJSON(err, data) {
    ...
}

const beaconURL = "https://beacon.clcert.cl/beacon/2.0/pulse/last";
let xhr = new XMLHttpRequest();
xhr.open("GET", beaconURL, true);
xhr.onload = function () {
   if (xhr.status === 200) {
       const beaconPulse = JSON.parse(xhr.response).pulse;
       handleJSON(null, beaconPulse);
   } else {
       handleJSON(xhr.status, null);
   }
};
xhr.send();
```

Python
```python
import requests

def handle_json(data):
    ...

beacon_url = "https://beacon.clcert.cl/beacon/2.0/pulse/last"
content = requests.get(beacon_url)
pulse = content.json()["pulse"]
handle_json(pulse)
```

## Utilización del string obtenido desde el Beacon de Random UChile

Una vez recibido dicho string, este es utilizado como semilla por un generador pseudo aleatorio que sirve para obtener 
un número entero (o real), que pueda ser usado dentro de un proceso que requiera aleatoriedad, contando, en paralelo la 
cantidad de llamados a la función que entrega dichos valores. En el caso específico de Random Comments, se utilizan
dichos números como representantes para los comentarios a escoger dentro del universo de comentarios válidos del post.

<p align="center">
    <img alt="Pseudo Random Number Generator" src="img/prng.png"/>
</p>

A continuación se puede apreciar un ejemplo de uso de la semilla obtenida anteriormente luego de ser entregada a un generador pseudo 
aleatorio, con una posterior generación y uso de valores entregados por el mismo:

Javascript
```javascript
// Pendiente
```

Python
```python
import random

def handle_json(data):
    beacon_seed = data["outputValue"]
    random.seed(beacon_seed)
    print(random.randint(0, 10))
```


## Verificación vía replicación de un proceso aleatorio

Una vez que se ha terminado con el proceso que requiere aleatoriedad, puede ser de interés para terceras personas el 
verificar que dicho proceso aleatorio fue legítimo. Para ello hay varios enfoques, pero en esta sección se mencionará
cómo se hizo en Random Comments (aunque puede servir como fórmula para cualquier proceso). 

La idea es que quien realiza el proceso aleatorio, antes de hacer uso de aleatoriedad, guarde el estado inicial de la
información con la que trabajará (por ejemplo en Random Comments se guarda una lista de pares usuario, comentario que 
sean válidos). 

A continuación, por cada llamado al generador pseudo aleatorio se aumenta en uno a un contador de
llamados. 

Finalmente se comparte la información inicial (identificador del pulso utilizado, datos iniciales y contador) para que
un tercero pueda verificar la correctitud del proceso replicando el mismo, localmente.

<p align="center">
    <img alt="Verificación API Random Uchile" src="img/verification.png"/>
</p>

<!-- TODO: Agregar código ejemplo --> 


## Resumen Proceso

El proceso en general, puede ser descrito por el siguiente diagrama de secuencia: 

<p align="center">
    <img alt="Diagrama de Secuencia uso API Random Uchile" src="img/sequence-diagram-api.png"/>
</p>

Donde se agregó un *Share Server* que sirve para indicar que se publicó
la información del proceso realizado en algunamansin lugar para que una tercera
parte pueda verificar la correctitud del mismo.