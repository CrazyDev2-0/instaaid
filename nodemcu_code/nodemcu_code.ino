#include <LiquidCrystal_I2C.h>
#include <Wire.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <ESP8266HTTPClient.h>


#define SSID_NAME "YOUR_WIFI_USERNAME"
#define SSID_PASS "YOUR_WIFI_PASSWORD"
#define MACHINE_CODE "machine_01"


int lcdColumns = 16;
int lcdRows = 2;

String lcdFirstLineText = "Initializing";
String lcdSecondLineText = "Wait . . ";

const int RED = 14;
const int GREEN = 12;
const int BLUE = 13;


String serverRoute = "http://instaaidapi.tanmoy.codes/get-order?code=";


// LCD Setup
LiquidCrystal_I2C lcd(0x3F, lcdColumns, lcdRows);
// WIFI Setup
ESP8266WiFiMulti WiFiMulti;


HTTPClient http;
WiFiClient client;


void setup() {
  Serial.begin(9600);
  pinMode(RED, OUTPUT);
  pinMode(GREEN, OUTPUT);
  pinMode(BLUE, OUTPUT);
  noStateLED();

  lcd.init();
  lcd.backlight();
  refreshLcdScreen();

  // Connect to WIFI
  if (WiFi.getMode() & WIFI_AP) WiFi.softAPdisconnect(true);
  WiFiMulti.addAP(SSID_NAME, SSID_PASS);

  lcdFirstLineText = "Connecting To";
  lcdSecondLineText = "Wifi";
  refreshLcdScreen();

  while (WiFiMulti.run() != WL_CONNECTED)
  {
    idealStateLED();
    delay(40);
    noStateLED();
    delay(40);
  }

  lcdFirstLineText = "Connected To";
  lcdSecondLineText = "Wifi";
  refreshLcdScreen();
  delay(1000);

  lcdFirstLineText = "Welcome";
  lcdSecondLineText = "Scan QR";
  refreshLcdScreen();
  idealStateLED();
}

void loop() {

  String serverPath = serverRoute+MACHINE_CODE;

  // Your Domain name with URL path or IP address with path
  http.begin(client, serverPath.c_str());

  // Send HTTP GET request
  int httpResponseCode = http.GET();

  if (httpResponseCode > 0) {
    String payload = http.getString();
    if(payload != ""){
        int i = payload.indexOf("-");
        String orderType = payload.substring(0,1);
        String orderId = payload.substring(1, i);
        Serial.println(orderId);
        String count = payload.substring(i+1);
        int count_int = count.toInt();
        lcdFirstLineText = "Order received";
        if(orderType == "1"){
          lcdSecondLineText = count+" condoms";
        }else if(orderType == "2"){
          lcdSecondLineText = count+" pads";
        }else{
          lcdSecondLineText = "- - -";
        }

        refreshLcdScreen();
        successStateLED();
        delay(5000);
        lcdFirstLineText = "Dispensing";
        if(orderType == "1"){
          lcdSecondLineText = count+" condoms";
        }else if(orderType == "2"){
          lcdSecondLineText = count+" pads";
        }else{
          lcdSecondLineText = "- - -";
        }
        refreshLcdScreen();
        denyStateLED();
        delay(5000);
        lcdFirstLineText = "Welcome";
        lcdSecondLineText = "Scan QR";
        refreshLcdScreen();
        idealStateLED();
    }
    delay(500);
  }
  else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
  }
  // Free resources
  http.end();
}


// CORE Functions
void denyStateLED() {
  analogWrite(RED, 0);
  analogWrite(GREEN, 255);
  analogWrite(BLUE, 255);
}

void successStateLED() {
  analogWrite(RED, 255);
  analogWrite(GREEN, 0);
  analogWrite(BLUE, 255);
}

void idealStateLED() {
  analogWrite(RED, 255);
  analogWrite(GREEN, 255);
  analogWrite(BLUE, 0);
}

void noStateLED() {
  analogWrite(RED, 255);
  analogWrite(GREEN, 255);
  analogWrite(BLUE, 255);
}

//Refresh LCD Scre
void refreshLcdScreen() {
  lcd.clear();
  Serial.println(lcdFirstLineText.length());
  lcd.setCursor(calulateOffset(lcdFirstLineText), 0);
  lcd.print(lcdFirstLineText);
  lcd.setCursor(calulateOffset(lcdSecondLineText), 1);
  lcd.print(lcdSecondLineText);
}

// Offset to make text center
int calulateOffset(String text) {
  int freePixels = lcdColumns - text.length();
  int offset = freePixels / 2;
  if (offset < 0 || offset == 16 || offset == 15) {
    return 0;
  }
  return offset;
}
