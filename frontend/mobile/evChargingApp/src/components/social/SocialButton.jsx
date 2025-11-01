import React from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Icon from "react-native-vector-icons/FontAwesome";

export const SocialButton = ({ icon, text, color = "#000", onPress }) => (
  <TouchableOpacity style={[styles.button, { borderColor: color }]} onPress={onPress}>
    <View style={styles.content}>
      <Icon name={icon} size={20} color={color} />
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    marginVertical: 6,
  },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  text: { fontSize: 16, fontWeight: "500" },
});