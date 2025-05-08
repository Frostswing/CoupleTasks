import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ShoppingListScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>רשימת קניות</Text>
      <Text>כאן תופיע רשימת הקניות בהמשך</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

export default ShoppingListScreen;
