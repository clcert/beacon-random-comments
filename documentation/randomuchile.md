# Beacon Random UChile API

Este documento es una especie de guía sobre cómo utilizar la API de Random UChile para crear una aplicación que utiliza 
la aleatoriedad generada por el Beacon de Random UChile y poder verificar a posteriori la validez del proceso.


## Cómo llamar a la API del Beacon de Random UChile

En esta aplicación en específico se utiliza la API de Random UChile para, a través de una consulta GET obtener un 
archivo de formato JSON que contiene un string de XXX bytes generado aleatoriamente. 

<p align="center">
    <img alt="API Random Uchile" src="img/api-call.png"/>
</p>

Se presenta continuación un ejemplo de consultas para obtener dicho JSON en Javascript y en Python.

<!-- TODO: Agregar ejemplos -->


## Cómo utilizar el string obtenido del Beacon de Random UChile

Una vez recibido dicho string, este es utilizado como semilla por un generador pseudo aleatorio que sirve para obtener 
un número entero (o real), que pueda ser usado dentro de un proceso que requiera aleatoriedad, contando, en paralelo la 
cantidad de llamados a la función que entrega dichos valores. En el caso específico de Random Comments, se utilizan
dichos números como representantes para los comentarios a escoger dentro del universo de comentarios válidos del post.

<p align="center">
    <img alt="API Random Uchile" src="img/prng.png"/>
</p>

A continuación se puede apreciar un ejemplo de uso de la semilla obtenida anteriormente por un generador pseudo 
aleatorio y la posterior generación y uso de valores entregados por el mismo:


## Cómo verificar vía replicación de un proceso aleatorio

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
    <img alt="API Random Uchile" src="img/verification.png"/>
</p>

<!-- TODO: Agregar código ejemplo --> 


<!-- TODO: Agregar Diagrama general -->