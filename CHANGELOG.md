# Changelog

All notable changes to this project will be documented in this file.

The format is mainly based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## 1.6.0

* Added: New tag system for the influx data
* Changed: Add the MQTT prefix called smarthome

## 1.5.1

* Fixed: Use the system of the Config class in the MQTT broker

## 1.5.0

* Changed: Add a static field for the system name
* Changed: Optimize InfluxDB and MQTT broker log

## 1.4.1

* Fixed: Reorder Config constructor for better usability

## 1.4.0

* Changed: Use a static field for the log level

## 1.3.1

* Fixed: Clean up logging messages

## 1.3.0

* Added: Allow to check the base state (active, listing, connected) for public

## 1.2.0

* Added: Callback function for device connection state in the MqttClient

## 1.1.2

* Fixed: Allow undefined log level, fall back to info

## 1.1.1

* Fixed: Don't require the log level in the ConfigBase

## 1.1.0

* Added: Optional configuration for the log level
* Added: Additional debug and trace log output

## 1.0.0

* Changed: Completely reworked for the smart home with a core MQTT communication

## 0.3.0

* Added: Option to allow untrusted connections to InfluxDB

## 0.2.1

* Fixed: Missing export for InfluxDb2

## 0.2.0

* Added: Add support for InfluxDB v2

## 0.1.0

* Changed: Loxone message now contains location and description

## 0.0.2

* Fixed: Clean up npm package

## 0.0.1

* Added: Initial release
