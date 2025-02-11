import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {BleManager, Device} from 'react-native-ble-plx';

const App = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false); // Track scan status
  const bleManagerRef = useRef(new BleManager()); // Ensure a single instance

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
          console.log('Bluetooth permissions denied');
        }
      }
    };

    requestPermissions(); // Request permissions on mount

    const bleManagerInstance = bleManagerRef.current; // Store the reference
    return () => {
      bleManagerInstance.destroy(); // Proper cleanup
    };
  }, []);

  const startScan = () => {
    setDevices([]); // Clear previous devices
    setIsScanning(true);
    setScanCompleted(false);

    const bleManagerInstance = bleManagerRef.current; // Store the instance

    bleManagerInstance.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan Error:', error);
        setIsScanning(false);
        setScanCompleted(true);
        return;
      }

      if (device) {
        console.log(`Found Device: ${device.name || 'Unnamed'} (${device.id})`);
        setDevices(prevDevices => {
          if (!prevDevices.some(d => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });

    setTimeout(() => {
      bleManagerInstance.stopDeviceScan();
      setIsScanning(false);
      setScanCompleted(true); // Mark scan as finished
    }, 10000); // Stop scan after 10 seconds
  };

  return (
    <View style={{padding: 20}}>
      <Text style={{fontSize: 18, fontWeight: 'bold'}}>Bluetooth Devices:</Text>

      {scanCompleted && devices.length === 0 ? (
        <Text style={{color: 'red'}}>No devices found</Text>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <Text>
              {item.name || 'Unnamed Device'} ({item.id})
            </Text>
          )}
        />
      )}

      <Button
        title={isScanning ? 'Scanning...' : 'Start Scan'}
        onPress={startScan}
        disabled={isScanning}
      />
    </View>
  );
};

export default App;
