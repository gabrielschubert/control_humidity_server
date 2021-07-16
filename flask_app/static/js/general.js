
var time = false;
var temperatures = false;
var humidities = false;
var chartData = false;
var autoControl = true;
var timeFormat = 'hh:mm';

var tempAtualElement = document.getElementById("temp-atual-value")
var humiAtualElement = document.getElementById("humi-atual-value")
var humistateAtualElement = document.getElementById("humistate-atual-value")

var umidadeDesejadaElement = document.getElementById("umidade-desejada-input")
var variacaoMaximaElement = document.getElementById("variacao-maxima-input")
var updateInfoButton = document.getElementById("update-info")

var autoControlOnRadio = document.getElementById("auto-control-on-input")
var autoControlOffRadio = document.getElementById("auto-control-off-input")
var ligarDesligarHumiButton = document.getElementById("ligar-desligar-humi")
var ligarDesligarHumiLabel = document.getElementById("on-off-label")

updateInfoButton.addEventListener('click', update_info);
autoControlOnRadio.addEventListener('click', change_auto_control_on);
autoControlOffRadio.addEventListener('click', change_auto_control_off);
ligarDesligarHumiButton.addEventListener('click', on_off_humi)

var baseUrl = '@Url.Content("~/mvc")';
console.log(baseUrl)

function on_off_humi(){
    $.ajax({
        type: 'POST',
        url: '/post-humi-on-off',
        dataType: 'json',
        data: JSON.stringify({
            "change_state": true,
        }),
        contentType: 'application/json',
        success: function (data) {
            if (data['humi_state']==true){
                humistateAtualElement.innerHTML = `Umidificador Ligado`;
                ligarDesligarHumiButton.innerText = `Desligar`
            }else if (data['humi_state']==false){
                humistateAtualElement.innerHTML = `Umidificador Desligado`                            ;
                ligarDesligarHumiButton.innerText = `Ligar`
            }
        }
    })
}

function change_auto_control_on(){
    $.ajax({
        type: 'POST',
        url: '/post-update-auto-control',
        dataType: 'json',
        data: JSON.stringify({
            "auto_control": true,
        }),
        contentType: 'application/json',
        success: function () {
            get_last_status();
        }
    })
}

function change_auto_control_off(){
    $.ajax({
        type: 'POST',
        url: '/post-update-auto-control',
        dataType: 'json',
        data: JSON.stringify({
            "auto_control": false,
        }),
        contentType: 'application/json',
        success: function () {
            get_last_status();
        }
    })
}

function get_data(){
    $.ajax({
                    url: '/get-data',
                    type: 'GET',
                    dataType: 'json',
                    //data: JSON.stringify({'art_name': modalTextNovaArte.value}),
                    contentType: 'application/json',
                    success: function (data) {
                        time = split_time(data["time"]);
                        temperatures = data["temperature"];
                        humidities = data["humidity"]
                        humidifier_state = data["humidifier_state"]
                    },
                    async: false
                }); 
}

function get_last_status(){
    $.ajax({
                    url: '/get-last-status',
                    type: 'GET',
                    dataType: 'json',
                    //data: JSON.stringify({'art_name': modalTextNovaArte.value}),
                    contentType: 'application/json',
                    success: function (data) {
                        autoControl = data["auto_control"];
                        if (autoControl == false){
                            umidadeDesejadaElement.disabled = true;
                            variacaoMaximaElement.disabled = true;
                            updateInfoButton.disabled = true;
                            ligarDesligarHumiLabel.style.display = 'block';
                            ligarDesligarHumiButton.style.display = 'block';
                            autoControlOffRadio.checked = true;
                        }else if (autoControl == true){
                            umidadeDesejadaElement.disabled = false;
                            variacaoMaximaElement.disabled = false;
                            updateInfoButton.disabled = false;
                            ligarDesligarHumiLabel.style.display = 'none';
                            ligarDesligarHumiButton.style.display = 'none';
                            autoControlOnRadio.checked = true;
                        }
                        tempAtualElement.innerHTML = `Temperatura: ${data["temperature"]}°C`;
                        humiAtualElement.innerHTML = `Umidade: ${data["humidity"]}%`;
                        humidifier_state = data["humidifier_state"]
                        if (humidifier_state==1){
                            humistateAtualElement.innerHTML = `Umidificador Ligado`;
                            ligarDesligarHumiButton.innerText = `Desligar`
                        }else if (humidifier_state==0){
                            humistateAtualElement.innerHTML = `Umidificador Desligado`                            ;
                            ligarDesligarHumiButton.innerText = `Ligar`
                        }
                    },
                    async: false
                }); 
}

function get_set_point(){
    $.ajax({
                    url: '/get-set-point',
                    type: 'GET',
                    dataType: 'json',
                    //data: JSON.stringify({'art_name': modalTextNovaArte.value}),
                    contentType: 'application/json',
                    success: function (data) {
                        umidadeDesejadaElement.value = data["humidity_set_point"];
                        variacaoMaximaElement.value = data["humidity_deviation"];
                    },
                    async: false
                }); 
}

function update_info(){
    console.log("updating...")
    if (umidadeDesejadaElement.value>100. ||
        umidadeDesejadaElement.value<0. ||
        variacaoMaximaElement.value<0. ||
        variacaoMaximaElement.value>5.){
            window.alert("Valores Incorretos!\n\nUmidade só varia de 0 a 100% e a variação de 0 a 5%")
            get_set_point()
    }
    else{
        $.ajax({
            type: 'POST',
            url: '/post-update-info',
            dataType: 'json',
            data: JSON.stringify({
                "humidity_set_point": umidadeDesejadaElement.value,
                "humidity_deviation": variacaoMaximaElement.value,
            }),
            contentType: 'application/json',
            success: function () {
                get_set_point();
                window.alert("Valores alterados com sucesso!")
            }
        })
    }
}

function split_time(tempo){
    let x = new Date(tempo[0])
    var t2 = new Array();
    for (var i = 0; i < tempo.length; i++) {
        t = new Date(tempo[i])
        t2.push(moment().hour(t.getUTCHours()).minute(t.getUTCMinutes()).format(timeFormat));
    }
    return(t2)
}

function newDateString(hours, minutes, seconds) {
    return moment().hour(hours).minute(minutes).second(seconds).format(timeFormat);
    }

function update_chart(){
    get_data();
    Temp_chart.data.labels = time
    Temp_chart.data.datasets[0].data = temperatures;
    
    Hum_chart.data.labels = time
    Hum_chart.data.datasets[0].data = humidities;
    
    Temp_chart.update();   
    Hum_chart.update();
}

get_data();
get_set_point();
get_last_status();
setInterval(update_chart, 30000)
setInterval(get_last_status, 5000)

var tempctx = document.getElementById('Temp_chart').getContext('2d');
var Temp_chart = new Chart(tempctx, {
    type: 'line',
    data: {
        labels: time,
        datasets: [{
            label: 'Temperatura [°C]',
            data: temperatures,
            fill: false,
            borderColor: 'rgb(52, 90, 194)',
            tension: 0.1
            }]
    },
});

var humctx = document.getElementById('Hum_chart').getContext('2d');
var Hum_chart = new Chart(humctx, {
    type: 'line',
    data: {
        labels: time,
        datasets: [{
            label: 'Umidade [%]',
            data: humidities,
            fill: false,
            borderColor: 'rgb(52, 90, 194)',
            tension: 0.1
            }]
    },
});