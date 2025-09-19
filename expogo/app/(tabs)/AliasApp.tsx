import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View, Button, FlatList, Alert, ActivityIndicator } from "react-native";

const BASE_URL = "http://192.168.100.9:5000/atas-garis/us-central1/api"; 
// ganti sesuai backend

export default function App() {
  const [aliases, setAliases] = useState([]);
  const [targetAlias, setTargetAlias] = useState("");
  const [activeAlias, setActiveAlias] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  async function fetchAliases() {
    setFetching(true);
    try {
      const res = await fetch(`${BASE_URL}/aliases`);
      const data = await res.json();
      setAliases(data.aliases || []);
    } catch (err) {
      console.error("fetchAliases error:", err);
      Alert.alert("Error", "Gagal ambil daftar alias");
    }
    setFetching(false);
  }

  useEffect(() => {
    fetchAliases();
  }, []);

  async function handleConfirmAlias() {
    if (!activeAlias) {
      Alert.alert("Pilih alias aktif dulu dari daftar!");
      return;
    }
    if (!targetAlias) {
      Alert.alert("Isi alias target!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromAlias: activeAlias.alias, toAlias: targetAlias }),
      });
      const data = await res.json();
      if (data.success !== false) {
        Alert.alert("✅ Konfirmasi sukses", `${activeAlias.alias} -> ${targetAlias}`);
      } else {
        Alert.alert("Error", data.error);
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
    setLoading(false);
  }

  async function handleCheckAlias() {
    if (!targetAlias) {
      Alert.alert("Isi alias target!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/aliases`);
      const data = await res.json();
      const found = data.aliases.filter((a) => a.alias === targetAlias);
      if (found.length > 0) {
        Alert.alert("Alias ditemukan", JSON.stringify(found, null, 2));
      } else {
        Alert.alert("Alias tidak ada");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alias App 🚀</Text>

      {activeAlias ? (
        <Text style={styles.active}>Alias aktif: {activeAlias.alias}</Text>
      ) : (
        <Text style={styles.active}>Pilih alias dari daftar</Text>
      )}

      {fetching ? (
        <ActivityIndicator size="large" color="#0f0" style={{ margin: 20 }} />
      ) : aliases.length > 0 ? (
        <FlatList
          data={aliases}
          keyExtractor={(item) => item.hash}
          renderItem={({ item }) => (
            <Text
              style={[
                styles.alias,
                activeAlias?.alias === item.alias && styles.selected,
              ]}
              onPress={() => setActiveAlias(item)}
            >
              {item.alias} (#{item.height})
            </Text>
          )}
        />
      ) : (
        <Text style={styles.empty}>⚠️ Tidak ada alias</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Masukkan alias target"
        placeholderTextColor="#aaa"
        value={targetAlias}
        onChangeText={setTargetAlias}
      />

      <View style={styles.buttonContainer}>
        <Button title="Konfirmasi Alias" onPress={handleConfirmAlias} disabled={loading} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Cek Alias" onPress={handleCheckAlias} disabled={loading} />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="🔄 Refresh Alias" onPress={fetchAliases} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 40, backgroundColor: "#121212" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#fff" },
  alias: { padding: 10, borderBottomWidth: 1, borderColor: "#333", color: "#fff" },
  selected: { backgroundColor: "#333" },
  active: { marginVertical: 10, fontWeight: "bold", color: "#fff" },
  input: { borderWidth: 1, borderColor: "#555", padding: 10, marginVertical: 10, color: "#fff" },
  empty: { marginVertical: 20, textAlign: "center", color: "#aaa" },
  buttonContainer: { marginVertical: 5 },
});