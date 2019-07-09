# Randomness Beacon API Lottery Tutorial - Random UChile

Este es un mini tutorial sobre como utilizar la API del Beacon de Random
UChile. Se mostrará paso a paso como desarrollar una aplicación que 
simule una lotería incluyendo los mismos puntos mencionados en [el documento de la API](randomuchile.md) (es decir: llamado, uso de valor aleatorio, generar 
datos de verificación y la verificación en sí). A diferencia del 
documento introductorio de la API, este tutorial provee código
(testeado) en distintos lenguajes de programación junto con links para
poder ver cómo debiera ejecutarse cada paso del proceso aleatorio.


## Lottery Tutorial

La aplicación a desarrollar será una lotería en la que habrá una entidad
realizadora del sorteo, la que utilizará la API de Random UChile para
obtener una semilla y generar N números al azar entre 1 y M. Se 
realizarán T intentos que serán descartados, siendo válido solo el T+1. 
Por otro lado se simulará a un observador que busque verificar que, 
efectivamente se generó dicho valor utilizando la semilla proveída por 
el beacon, generando localmente los números y comparándolos con los
valores generados por quien realizó el sorteo.
 
INSERTAR UNA IMAGEN
 
Como se mencionó anteriormente, este tutorial consta de cuatro partes. 
Entre ellas:

1. Llamado a la API de Random UChile
2. Uso del valor aleatorio
3. Datos para verificación del proceso
4. Verificación por un observador externo


### 1. Llamado a la API de Random UChile

Los detalles para aplicaciones en general puede ser visto en este [link](randomuchile.md).
Esta sección es la misma para cualquier aplicación, pero de igual modo
se provee el código utilizado para esta en particular:

#### 1.1 Python
```python
import requests

# API URL
beacon_url = "https://beacon.clcert.cl/beacon/2.0/pulse/last"

def get_last_pulse():
  content = requests.get(beacon_url)

  # JSON containing all the pulse data
  pulse = content.json()["pulse"]
  
  # Random string of 512 bits obtained from the pulse
  seed = pulse["outputValue"]

  # This index will be used by the observer to verify the process
  pulse_index = pulse["pulseIndex"]

  return pulse_index, seed

pulse_index, seed = get_last_pulse()
print(f"({pulse_index}, {seed})")
``` 
Puede testear este código haciendo click [aquí](https://repl.it/@Choreza/API-Call)


### 2. Uso del valor aleatorio

Los detalles para aplicaciones en general puede ser visto en este [link](randomuchile.md).
Para esta aplicación en particular, se generarán N números ganadores 
para la lotería a partir del valor aleatorio obtenido de la API de 
Random UChile:


#### 2.1 Python
```python
import requests
import random

# API URL
beacon_url = "https://beacon.clcert.cl/beacon/2.0/pulse/last"

# Lottery total numbers
N = 6

# Lottery max value
M = 30

# Number of tries to be discarded
T = 3

def get_last_pulse():
  ...

def run_lottery():
  pulse_index, seed = get_last_pulse()
  
  # Seed the PRNG
  random.seed(seed)

  # The list to be shared 
  numbers = [0 for i in range(N)]

  for t in range(T+1):
    for i in range(N):
      exists = True

      # We assume numbers in lottery are unique, so we iterate until get a different
      # number
      while exists:
        number = random.randint(1, M+1)
        if not number in numbers:
          numbers[i] = number
          exists = False

    # We discard a "T" number of tries
    if t < T:
      numbers = [0 for i in range(N)]

  print(f"({pulse_index}, {seed}, {numbers})")

run_lottery()
```
Puede testear el código completo haciendo click [aquí](https://repl.it/@Choreza/Random-Value-Usage)


### 3. Datos para verificación del proceso

Los detalles para aplicaciones en general puede ser visto en este [link](randomuchile.md).
Se supone que en esta parte, la entidad encargada de realizar el sorteo
publica los datos en alguna parte. Se espera que al menos publique el 
estado inicial sobre el cual se ejecutará la función aleatoria, el 
identificador del pulso usado, el contador de intentos y el resultado
final. Como en esta aplicación no se dispondrá de un servidor o algún
lugar donde dejar públicos dichos datos, simplemente se guardaran en una
variable global DATA dentro del script.


#### 3.1 Python
```python
import requests
import random

# API URL
beacon_url = "https://beacon.clcert.cl/beacon/2.0/pulse/last"

# Lottery total numbers
N = 6

# Lottery max value
M = 30

# Number of tries to be discarded
T = 3

# Python dict containing the information of the last lottery
DATA = None

def get_last_pulse():
  ...

def run_lottery():
  ...
  publish(pulse_index, initial_numbers, T, numbers)

def publish(pulse_id, initial_data, tries, result):
  global DATA
  DATA = dict(
    pulseId = pulse_id,
    initialData = initial_data,
    tries = tries,
    resultData = result
  )
  print(DATA)

run_lottery()
```
Puede testear el código completo haciendo click [aquí](https://repl.it/@Choreza/Process-Verification-Data)


### 4. Verificación por un observador externo

Los detalles para aplicaciones en general puede ser visto en este [link](randomuchile.md).
Una vez guardada la información de la lotería en DATA, un observador
externo al proceso, en este caso podría ser una entidad reguladora o una
persona que haya comprado un ticket a la lotería tendría la motivación
suficiente para verificar la correctitud del proceso (que no se haya 
trampa). Para lograr dicho cometido el observador externo utilizará la
información de DATA y replicará localmente el proceso, comparando los
valores obtenidos con los publicados, en caso de obtener valores 
distintos, estará en todo su derecho de apelar por el error. Notar que
la entidad generadora de DATA debió haber utilizado un generador pseudo
aleatorio determinístico, puesto que de no hacerlo, cada persona que
quisiera verificar obtendría valores distintos aunque se utilice la
misma semilla. A continuación se presenta un script simple de 
verificación:

```python
import requests
import random

# API URL
beacon_last_url = "https://beacon.clcert.cl/beacon/2.0/pulse/last"
beacon_url = "https://beacon.clcert.cl/beacon/2.0/chain/4/pulse/"

# Lottery total numbers
N = 6

# Lottery max value
M = 30

# Number of tries to be discarded
T = 3

# Python dict containing the information of the last lottery
DATA = None

def get_last_pulse():
  ...

def run_lottery():
  ...
  
def publish(pulse_id, initial_data, tries, result):
  ...

def get_seed_by_pid(pulse_id):
  content = requests.get(beacon_url + str(pulse_id))

  # JSON containing all the pulse data
  pulse = content.json()["pulse"]
  
  # Random string of 512 bits obtained from the pulse
  seed = pulse["outputValue"]
  return seed

def verify():
  if DATA == None:
    print("Cannot verify None data")
    return

  seed = get_seed_by_pid(DATA["pulseId"])
  random.seed(seed)

  numbers = DATA["initialData"]
  tries = DATA["tries"]
  for t in range(tries+1):
    # We assume the observer knows how many numbers the lottery choose every time
    for i in range(N):
      exists = True

      # We assume numbers in lottery are unique, so we iterate until get a different
      # number
      while exists:
        # We assume the observer knows the maximum value of the lottery numbers
        number = random.randint(1, M+1)
        if not number in numbers:
          numbers[i] = number
          exists = False

    # We discard a "T" number of tries
    if t < tries:
      numbers = [0 for i in range(N)]

  result_data = DATA["resultData"]
  for i in range(len(result_data)):
    if numbers[i] != result_data[i]:
      print(f"Validation error at index {i} {result_data} {numbers}")
      return
  print("Validation successful")

run_lottery()
verify()
```
Puede testear el código completo haciendo click [aquí](https://repl.it/@Choreza/External-Observer-Verification)
