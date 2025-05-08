import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import {
  subscribeShoppingList,
  addShoppingItem,
  deleteShoppingItem,
  toggleItemPurchased,
  updateShoppingItem,
} from "../services/shoppingListService";

const ShoppingListScreen = () => {
  const [shoppingItems, setShoppingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // האזנה לשינויים ברשימת הקניות
    const unsubscribe = subscribeShoppingList((itemsList) => {
      console.log("Received shopping items in component:", itemsList);
      setShoppingItems(itemsList);
      setLoading(false);
    });

    // Set a timeout to handle case where Firebase doesn't respond
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Firebase timeout - still loading after 10 seconds");
        setLoading(false);
      }
    }, 10000);

    // הסרת האזנה כאשר הקומפוננטה נפרדת
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleAddItem = async () => {
    if (newItemName.trim() === "") {
      Alert.alert("שגיאה", "יש להזין שם לפריט");
      return;
    }

    const quantity = parseInt(newItemQuantity) || 1;

    setLoading(true);
    const result = await addShoppingItem({
      name: newItemName,
      quantity: quantity,
    });

    if (result.success) {
      setNewItemName("");
      setNewItemQuantity("1");
      setModalVisible(false);
    } else {
      Alert.alert("שגיאה", "לא ניתן להוסיף את הפריט");
    }
    setLoading(false);
  };

  const handleDeleteItem = async (itemId) => {
    Alert.alert("מחיקת פריט", "האם אתה בטוח שברצונך למחוק את הפריט מהרשימה?", [
      { text: "ביטול", style: "cancel" },
      {
        text: "מחיקה",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          await deleteShoppingItem(itemId);
          setLoading(false);
        },
      },
    ]);
  };

  const handleTogglePurchased = async (itemId, currentStatus) => {
    await toggleItemPurchased(itemId, !currentStatus);
  };

  const updateQuantity = async (itemId, currentQuantity, change) => {
    const newQuantity = Math.max(1, currentQuantity + change);
    await updateShoppingItem(itemId, { quantity: newQuantity });
  };

  const renderShoppingItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.purchaseButton}
        onPress={() => handleTogglePurchased(item.id, item.purchased)}
      >
        <View
          style={[styles.checkbox, item.purchased && styles.checkboxChecked]}
        />
      </TouchableOpacity>

      <View style={styles.itemContent}>
        <Text style={[styles.itemName, item.purchased && styles.purchasedText]}>
          {item.name}
        </Text>
      </View>

      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity, -1)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>

        <Text style={styles.quantityText}>{item.quantity}</Text>

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity, 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteItem(item.id)}
      >
        <Text style={styles.deleteButtonText}>מחק</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>רשימת קניות</Text>

      {loading ? (
        <Text style={styles.loadingText}>טוען...</Text>
      ) : shoppingItems.length === 0 ? (
        <Text style={styles.emptyText}>
          אין פריטים ברשימת קניות. הוסף פריט חדש!
        </Text>
      ) : (
        <FlatList
          data={shoppingItems}
          renderItem={renderShoppingItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ הוסף פריט</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>פריט חדש</Text>

            <TextInput
              style={styles.input}
              placeholder="שם הפריט"
              value={newItemName}
              onChangeText={setNewItemName}
            />

            <View style={styles.quantityInputContainer}>
              <Text style={styles.quantityLabel}>כמות:</Text>
              <TextInput
                style={styles.quantityInput}
                keyboardType="numeric"
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewItemName("");
                  setNewItemQuantity("1");
                }}
              >
                <Text style={styles.buttonText}>ביטול</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddItem}
              >
                <Text style={styles.buttonText}>שמירה</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  loadingText: {
    textAlign: "center",
    marginTop: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#888",
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemContent: {
    flex: 1,
  },
  purchaseButton: {
    padding: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f4511e",
  },
  checkboxChecked: {
    backgroundColor: "#f4511e",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  purchasedText: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f4511e",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: "center",
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    color: "red",
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#f4511e",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    textAlign: "right",
  },
  quantityInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginVertical: 8,
  },
  quantityLabel: {
    marginRight: 10,
    fontSize: 16,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    width: 80,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: "#f4511e",
  },
  cancelButton: {
    backgroundColor: "#ddd",
  },
  buttonText: {
    fontWeight: "bold",
    color: "white",
  },
});

export default ShoppingListScreen;
