import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {BleManager, Device} from 'react-native-ble-plx';

const App = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const bleManagerRef = useRef(new BleManager());

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);

        if (
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] !==
            PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] !==
            PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] !==
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          Alert.alert('Permission Required', 'Bluetooth permissions denied');
          console.log('Bluetooth permissions denied');
        }
      }
    };

    requestPermissions();
    const bleManagerInstance = bleManagerRef.current;

    return () => {
      bleManagerInstance.destroy();
    };
  }, []);

  const startScan = () => {
    setDevices([]);
    setIsScanning(true);
    setScanCompleted(false);

    const bleManagerInstance = bleManagerRef.current;
    const foundDevices = new Map(); // Store unique devices

    bleManagerInstance.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan Error:', error);
        setIsScanning(false);
        setScanCompleted(true);
        return;
      }

      if (device) {
        console.log(`Found Device: ${device.name || 'Unnamed'} (${device.id})`);
        foundDevices.set(device.id, device);

        const updatedDevices = Array.from(foundDevices.values());

        // Sort: Named devices first, then unnamed
        updatedDevices.sort((a, b) => {
          if (a.name && !b.name) {
            return -1;
          }
          if (!a.name && b.name) {
            return 1;
          }
          return 0;
        });

        setDevices(updatedDevices);
      }
    });

    setTimeout(() => {
      bleManagerInstance.stopDeviceScan();
      setIsScanning(false);
      setScanCompleted(true);
    }, 20000);
  };

  const connectToDevice = async (device: Device) => {
    try {
      await bleManagerRef.current.connectToDevice(device.id);
      console.log(
        `Connected to ${device.name || 'Unnamed Device'} (${device.id})`,
      );
      setConnectedDevice(device);
    } catch (error) {
      console.error('Connection Error:', error);
      Alert.alert('Connection Failed', 'Could not connect to the device.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bluetooth Devices</Text>

      {scanCompleted && devices.length === 0 ? (
        <Text style={styles.noDevices}>No devices found</Text>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={styles.deviceItem}>
              <Text style={styles.deviceText}>
                {item.name || 'Unnamed Device'} ({item.id})
              </Text>
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => connectToDevice(item)}>
                <Text style={styles.buttonText}>Connect</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Button
        title={isScanning ? 'Scanning...' : 'Start Scan'}
        onPress={startScan}
        disabled={isScanning}
      />

      {connectedDevice && (
        <Text style={styles.connectedText}>
          Connected to {connectedDevice.name || 'Unnamed Device'} (
          {connectedDevice.id})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {padding: 20},
  header: {fontSize: 18, fontWeight: 'bold', marginBottom: 10},
  noDevices: {color: 'red', marginBottom: 10},
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
  },
  deviceText: {flex: 1},
  connectButton: {backgroundColor: 'blue', padding: 10, borderRadius: 5},
  buttonText: {color: 'white', fontWeight: 'bold'},
  connectedText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
  },
});

export default App;
