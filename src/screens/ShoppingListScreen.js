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
  Switch,
} from "react-native";
import {
  subscribeShoppingList,
  addShoppingItem,
  deleteShoppingItem,
  toggleItemPurchased,
  updateItemInventory,
  updateItemNeededAmount,
  toggleItemEssential,
  cleanupExpiredItems,
  updateShoppingItem,
  resetItemInventory,
  updateItemWantedAmount,
  finishShoppingCycle,
} from "../services/shoppingListService";
import { getCurrentUser } from "../services/userService";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const ShoppingListScreen = () => {
  const [shoppingItems, setShoppingItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemNeededAmount, setNewItemNeededAmount] = useState("1");
  const [newItemAvailableAmount, setNewItemAvailableAmount] = useState("0");
  const [newItemIsEssential, setNewItemIsEssential] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [purchasedQuantity, setPurchasedQuantity] = useState("1");
  const [currentUser, setCurrentUser] = useState(null);
  const [dataSource, setDataSource] = useState({ isShared: false });
  const [showShoppingList, setShowShoppingList] = useState(true);
  const [showInventoryList, setShowInventoryList] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    // בדיקת מצב התחברות של המשתמש
    const user = getCurrentUser();
    setCurrentUser(user);

    // ניקוי של פריטי "מותרות" שפג תוקפם
    if (user) {
      cleanupExpiredItems();
    }

    // האזנה לשינויים ברשימת הקניות
    const unsubscribe = subscribeShoppingList((data) => {
      console.log("Received shopping list data:", data);
      setShoppingItems(data.shoppingItems || []);
      setInventoryItems(data.inventoryItems || []);
      if (data.dataSource) {
        setDataSource(data.dataSource);
      }
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
    // בדיקה שהמשתמש מחובר
    const user = getCurrentUser();
    if (!user) {
      Alert.alert("נדרשת התחברות", "עליך להתחבר לחשבון לפני הוספת פריטים", [
        {
          text: "ביטול",
          style: "cancel",
        },
        {
          text: "מעבר להתחברות",
          onPress: () => navigation.navigate("Auth"),
        },
      ]);
      return;
    }

    if (newItemName.trim() === "") {
      Alert.alert("שגיאה", "יש להזין שם פריט");
      return;
    }

    setLoading(true);
    // בפריטי מותרות, quantity לא משמעותי אז נשים 1 כברירת מחדל
    const quantity = 1;
    const neededAmount = parseInt(newItemNeededAmount) || 1;
    const availableAmount = parseInt(newItemAvailableAmount) || 0;
    const wantedAmount = parseInt(newItemQuantity) || 0;

    const result = await addShoppingItem({
      name: newItemName,
      quantity: quantity,
      neededAmount: neededAmount,
      availableAmount: availableAmount,
      isEssential: newItemIsEssential,
      wantedAmount: wantedAmount,
    });

    if (result.success) {
      setNewItemName("");
      setNewItemQuantity("1");
      setNewItemNeededAmount("1");
      setNewItemAvailableAmount("0");
      setNewItemIsEssential(false);
      setModalVisible(false);
    } else {
      Alert.alert("שגיאה", result.error || "לא ניתן להוסיף את הפריט");
    }
    setLoading(false);
  };

  const handleDeleteItem = async (itemId) => {
    Alert.alert("מחיקת פריט", "האם אתה בטוח שברצונך למחוק את הפריט?", [
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
    // אם הפריט כבר מסומן כנקנה, נבטל את הסימון
    if (currentStatus) {
      await toggleItemPurchased(itemId, false);
      return;
    }

    // מצא את הפריט הנוכחי
    const item = [...shoppingItems, ...inventoryItems].find(
      (item) => item.id === itemId
    );

    if (!item) return;

    // קביעת כמות ברירת המחדל בהתאם לסוג הפריט
    let defaultQuantity = "1";

    if (item.isEssential) {
      // בפריט נחוץ - מציגים את ההפרש בין מה שצריך למה שיש
      const diff = Math.max(0, item.neededAmount - item.availableAmount);
      defaultQuantity = diff.toString();
    } else {
      // בפריט מותרות - מציגים את הכמות הרצויה
      defaultQuantity = (item.wantedAmount || item.quantity || 1).toString();
    }

    // פתח תפריט לשאול כמה נקנה
    setCurrentItem(item);
    setPurchasedQuantity(defaultQuantity);
    setPurchaseModalVisible(true);
  };

  const handlePurchaseConfirm = async () => {
    if (!currentItem) return;

    const quantity = parseInt(purchasedQuantity) || 1;
    setLoading(true);

    // עדכון שהפריט נקנה עם הכמות שנקנתה
    await toggleItemPurchased(currentItem.id, true, quantity);

    setPurchaseModalVisible(false);
    setCurrentItem(null);
    setPurchasedQuantity("1");
    setLoading(false);
  };

  const handleEditItem = (item) => {
    setCurrentItem(item);
    setEditModalVisible(true);
  };

  const handleSaveEditedItem = async () => {
    if (!currentItem) return;

    setLoading(true);
    // עדכון כמות נדרשת
    await updateItemNeededAmount(currentItem.id, currentItem.neededAmount);
    // עדכון כמות במלאי
    await updateItemInventory(currentItem.id, currentItem.availableAmount);
    // עדכון כמות רצויה (חד פעמית)
    await updateItemWantedAmount(currentItem.id, currentItem.wantedAmount || 0);
    // עדכון סוג פריט (נחוץ/מותרות)
    await toggleItemEssential(currentItem.id, currentItem.isEssential);

    setEditModalVisible(false);
    setCurrentItem(null);
    setLoading(false);
  };

  // עדכון כמות שרוצים לקנות
  const updateQuantity = async (itemId, currentQuantity, change) => {
    console.log("updateQuantity called with:", itemId, currentQuantity, change);
    const user = getCurrentUser();
    if (!user) {
      Alert.alert("שגיאה", "עליך להתחבר לחשבון לפני עדכון פריטים ברשימה");
      return;
    }

    const item = [...shoppingItems, ...inventoryItems].find(
      (i) => i.id === itemId
    );

    if (!item) {
      console.log("פריט לא נמצא:", itemId);
      return;
    }

    console.log("מצאתי פריט:", item);
    const oldWantedAmount = item.wantedAmount || 0;

    // כעת נעדכן את שדה wantedAmount ולא את quantity עבור כל הפריטים (נחוצים או לא)
    const newWantedAmount = Math.max(0, oldWantedAmount + change);
    console.log(`מעדכן כמות רצויה מ-${oldWantedAmount} ל-${newWantedAmount}`);

    try {
      setLoading(true);
      const result = await updateItemWantedAmount(itemId, newWantedAmount);
      console.log("תוצאת העדכון:", result);

      if (!result.success) {
        throw new Error(result.error || "שגיאה בעדכון הכמות הרצויה");
      }

      // המתנה קצרה כדי לוודא שהעדכון הגיע מפיירבייס בחזרה
      setTimeout(() => {
        // בדיקה אם הערך התעדכן בממשק
        const updatedItem = [...shoppingItems, ...inventoryItems].find(
          (i) => i.id === itemId
        );

        if (updatedItem && updatedItem.wantedAmount !== newWantedAmount) {
          console.log("הערך לא התעדכן בממשק! ננסה שוב...");
          console.log(
            "ערך בממשק:",
            updatedItem.wantedAmount,
            "ערך מצופה:",
            newWantedAmount
          );

          // עוד ניסיון לעדכן
          updateItemWantedAmount(itemId, newWantedAmount);
        } else {
          console.log("הערך התעדכן בהצלחה בממשק!");
        }

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("שגיאה בעדכון:", error);
      Alert.alert("שגיאה", "לא ניתן לעדכן את הכמות הרצויה: " + error.message);
      setLoading(false);
    }
  };

  // החזרת ההפרש בין מה שצריך למה שיש
  const getDifferenceDisplay = (item) => {
    if (!item) return "";

    // מחשב את הערך האפקטיבי הנדרש - מקסימום בין "צריך" ל"רוצים"
    const effectiveNeededAmount = item.isEssential
      ? Math.max(item.neededAmount || 0, item.wantedAmount || 0)
      : item.neededAmount || 0;

    const diff = effectiveNeededAmount - item.availableAmount;
    if (diff > 0) {
      return `חסר: ${diff}`;
    } else if (diff < 0) {
      return `עודף: ${Math.abs(diff)}`;
    } else {
      return "מאוזן";
    }
  };

  const handleResetInventory = async (itemId) => {
    Alert.alert(
      "איפוס מלאי",
      "האם אתה בטוח שברצונך לאפס את המלאי של פריט זה?",
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "איפוס",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            await resetItemInventory(itemId);
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleUpdateWantedAmount = async (itemId, wantedAmount) => {
    setLoading(true);
    await updateItemWantedAmount(itemId, wantedAmount);
    setLoading(false);
  };

  const handleFinishShopping = async () => {
    Alert.alert(
      "סיום קניות",
      "האם אתה בטוח שברצונך לסיים את מחזור הקניות? פעולה זו תמחק פריטי מותרות שנקנו, תעדכן את המלאי ותאפס את כל הסימונים.",
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "סיום קניות",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const result = await finishShoppingCycle();
            setLoading(false);

            if (result.success) {
              Alert.alert(
                "סיום קניות",
                result.message || "מחזור הקניות הסתיים בהצלחה"
              );
            } else {
              Alert.alert(
                "שגיאה",
                result.error || "אירעה שגיאה בסיום מחזור הקניות"
              );
            }
          },
        },
      ]
    );
  };

  const renderShoppingItem = ({ item }) => {
    // החישוב האפקטיבי של כמה שצריך - הגבוה מבין "צריך" ו"רוצים"
    const effectiveNeededAmount = Math.max(
      item.neededAmount || 0,
      item.wantedAmount || 0
    );

    // חישוב ההפרש בין מה שצריך למה שיש
    const diff = Math.max(
      0,
      effectiveNeededAmount - (item.availableAmount || 0)
    );

    return (
      <View style={styles.itemContainer}>
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleTogglePurchased(item.id, item.purchased)}
          >
            <View
              style={[
                styles.checkbox,
                item.purchased && styles.checkboxChecked,
              ]}
            />
          </TouchableOpacity>
          {item.purchased && item.purchasedQuantity > 0 && (
            <Text style={styles.purchasedQuantity}>
              {item.purchasedQuantity}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleEditItem(item)}
        >
          <View style={styles.itemHeader}>
            <Text
              style={[styles.itemName, item.purchased && styles.completedText]}
            >
              {item.name}
            </Text>
          </View>

          <View style={styles.itemDetails}>
            {item.isEssential ? (
              <>
                <Text style={styles.quantityText}>{diff} לקנות</Text>
                <Text style={styles.itemDetail}>
                  יש: {item.availableAmount || 0}
                </Text>
                <Text style={styles.itemDetail}>
                  צריך: {item.neededAmount || 0}
                </Text>
                {item.wantedAmount > 0 && (
                  <Text
                    style={[
                      styles.wantedAmount,
                      item.wantedAmount > item.neededAmount &&
                        styles.activeWantedAmount,
                    ]}
                  >
                    רוצים: {item.wantedAmount}
                    {item.wantedAmount > item.neededAmount && " (בתוקף)"}
                  </Text>
                )}
              </>
            ) : (
              <>
                <View style={styles.quantityRow}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      updateQuantity(item.id, item.quantity || 1, -1)
                    }
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>

                  <Text style={styles.quantityText}>
                    {item.wantedAmount || 0}
                  </Text>

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      updateQuantity(item.id, item.quantity || 1, 1)
                    }
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemDetail}>רוצים לקנות</Text>
              </>
            )}
            <Text
              style={[
                styles.itemType,
                item.isEssential ? styles.essentialItem : styles.luxuryItem,
              ]}
            >
              {item.isEssential ? "נחוץ" : "מותרות"}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Ionicons name="trash-outline" size={24} color="#f4511e" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderInventoryItem = ({ item }) => {
    // החישוב האפקטיבי של כמה שצריך - הגבוה מבין "צריך" ו"רוצים"
    const effectiveNeededAmount = Math.max(
      item.neededAmount || 0,
      item.wantedAmount || 0
    );

    // חישוב ההפרש בין מה שצריך למה שיש
    const diff = (item.availableAmount || 0) - effectiveNeededAmount;

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleEditItem(item)}
        >
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
          </View>

          <View style={styles.itemDetails}>
            {item.isEssential ? (
              <>
                <Text style={styles.differenceText}>
                  {diff >= 0 ? `עודף: ${diff}` : `חסר: ${Math.abs(diff)}`}
                </Text>

                <Text style={styles.itemDetail}>
                  צריך: {item.neededAmount || 1}
                </Text>
                <Text style={styles.itemDetail}>
                  יש: {item.availableAmount || 0}
                </Text>
                {item.wantedAmount > 0 && (
                  <Text
                    style={[
                      styles.wantedAmount,
                      item.wantedAmount > item.neededAmount &&
                        styles.activeWantedAmount,
                    ]}
                  >
                    רוצים: {item.wantedAmount}
                    {item.wantedAmount > item.neededAmount && " (בתוקף)"}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => handleResetInventory(item.id)}
                >
                  <Text style={styles.resetButtonText}>נגמר</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.itemDetail}>פריט מותרות</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Ionicons name="trash-outline" size={24} color="#f4511e" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>רשימת קניות</Text>
        {!currentUser ? (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Auth")}
          >
            <Text style={styles.loginButtonText}>
              התחבר כדי לראות את הרשימה שלך
            </Text>
          </TouchableOpacity>
        ) : (
          <View>
            <Text style={styles.dataSourceText}>
              {dataSource.isShared ? "רשימה משותפת" : "רשימה אישית"}
            </Text>
            <TouchableOpacity
              style={styles.finishShoppingButton}
              onPress={handleFinishShopping}
            >
              <Text style={styles.finishShoppingButtonText}>
                סיום קניות ואיפוס רשימה
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <Text style={styles.loadingText}>טוען...</Text>
      ) : !currentUser ? (
        <Text style={styles.emptyText}>
          עליך להתחבר כדי לראות את רשימת הקניות שלך
        </Text>
      ) : (
        <View style={styles.listsContainer}>
          {/* רשימת קניות */}
          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setShowShoppingList(!showShoppingList)}
            >
              <Text style={styles.sectionTitle}>
                לקנות ({shoppingItems.length})
              </Text>
              <Ionicons
                name={showShoppingList ? "chevron-down" : "chevron-forward"}
                size={24}
                color="#333"
              />
            </TouchableOpacity>

            {showShoppingList &&
              (shoppingItems.length === 0 ? (
                <Text style={styles.emptyListText}>אין פריטים לקנייה</Text>
              ) : (
                <FlatList
                  data={shoppingItems}
                  renderItem={renderShoppingItem}
                  keyExtractor={(item) => item.id}
                  style={styles.list}
                />
              ))}
          </View>

          {/* רשימת מלאי */}
          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setShowInventoryList(!showInventoryList)}
            >
              <Text style={styles.sectionTitle}>
                מה יש בבית ({inventoryItems.length})
              </Text>
              <Ionicons
                name={showInventoryList ? "chevron-down" : "chevron-forward"}
                size={24}
                color="#333"
              />
            </TouchableOpacity>

            {showInventoryList &&
              (inventoryItems.length === 0 ? (
                <Text style={styles.emptyListText}>אין פריטים במלאי</Text>
              ) : (
                <FlatList
                  data={inventoryItems}
                  renderItem={renderInventoryItem}
                  keyExtractor={(item) => item.id}
                  style={styles.list}
                />
              ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          if (!currentUser) {
            Alert.alert(
              "נדרשת התחברות",
              "עליך להתחבר לחשבון לפני הוספת פריטים",
              [
                {
                  text: "ביטול",
                  style: "cancel",
                },
                {
                  text: "מעבר להתחברות",
                  onPress: () => navigation.navigate("Auth"),
                },
              ]
            );
          } else {
            setModalVisible(true);
          }
        }}
      >
        <Text style={styles.addButtonText}>+ הוסף פריט</Text>
      </TouchableOpacity>

      {/* מודל הוספת פריט חדש */}
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
              placeholder="שם המוצר"
              value={newItemName}
              onChangeText={setNewItemName}
              placeholderTextColor="#999"
            />

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>
                {newItemIsEssential ? "פריט נחוץ" : "פריט מותרות"}
              </Text>
              <Switch
                value={newItemIsEssential}
                onValueChange={setNewItemIsEssential}
                thumbColor={newItemIsEssential ? "#007AFF" : "#f4f3f4"}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
              />
            </View>

            {newItemIsEssential && (
              <>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>כמה צריך:</Text>
                  <TextInput
                    style={[styles.numberInput, styles.lessImportantInput]}
                    placeholder="1"
                    value={newItemNeededAmount}
                    onChangeText={setNewItemNeededAmount}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>כמה יש:</Text>
                  <TextInput
                    style={styles.numberInput}
                    placeholder="0"
                    value={newItemAvailableAmount}
                    onChangeText={setNewItemAvailableAmount}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </>
            )}

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>רוצים (חד פעמי):</Text>
              <TextInput
                style={styles.numberInput}
                placeholder="0"
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewItemName("");
                  setNewItemQuantity("1");
                  setNewItemNeededAmount("1");
                  setNewItemAvailableAmount("0");
                  setNewItemIsEssential(false);
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

      {/* מודל עריכת פריט */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible && currentItem !== null}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              עריכת פריט: {currentItem?.name}
            </Text>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>
                {currentItem?.isEssential ? "פריט נחוץ" : "פריט מותרות"}
              </Text>
              <Switch
                value={currentItem?.isEssential}
                onValueChange={(value) =>
                  setCurrentItem({ ...currentItem, isEssential: value })
                }
                thumbColor={currentItem?.isEssential ? "#007AFF" : "#f4f3f4"}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
              />
            </View>

            {currentItem?.isEssential && (
              <>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>כמה צריך:</Text>
                  <TextInput
                    style={[styles.numberInput, styles.lessImportantInput]}
                    value={currentItem?.neededAmount?.toString() || "1"}
                    onChangeText={(text) =>
                      setCurrentItem({
                        ...currentItem,
                        neededAmount: parseInt(text) || 0,
                      })
                    }
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>כמה יש:</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={currentItem?.availableAmount?.toString() || "0"}
                    onChangeText={(text) =>
                      setCurrentItem({
                        ...currentItem,
                        availableAmount: parseInt(text) || 0,
                      })
                    }
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </>
            )}

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>רוצים (חד פעמי):</Text>
              <TextInput
                style={styles.numberInput}
                value={currentItem?.wantedAmount?.toString() || "0"}
                onChangeText={(text) =>
                  setCurrentItem({
                    ...currentItem,
                    wantedAmount: parseInt(text) || 0,
                  })
                }
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditModalVisible(false);
                  setCurrentItem(null);
                }}
              >
                <Text style={styles.buttonText}>ביטול</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveEditedItem}
              >
                <Text style={styles.buttonText}>עדכון</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* מודל "כמה קנית" */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={purchaseModalVisible && currentItem !== null}
        onRequestClose={() => setPurchaseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>כמה קנית? {currentItem?.name}</Text>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>כמות שנקנתה:</Text>
              <TextInput
                style={styles.numberInput}
                value={purchasedQuantity}
                onChangeText={(text) => setPurchasedQuantity(text)}
                keyboardType="numeric"
                placeholderTextColor="#999"
                autoFocus={true}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setPurchaseModalVisible(false);
                  setCurrentItem(null);
                  setPurchasedQuantity("1");
                }}
              >
                <Text style={styles.buttonText}>ביטול</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handlePurchaseConfirm}
              >
                <Text style={styles.buttonText}>אישור</Text>
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
  headerContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  dataSourceText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#f4511e",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  loginButtonText: {
    color: "white",
    fontWeight: "bold",
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
  emptyListText: {
    textAlign: "center",
    padding: 20,
    color: "#888",
  },
  listsContainer: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  list: {
    maxHeight: 300,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  checkboxContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  completeButton: {
    // הסרת marginRight כי כעת יש container
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemQuantity: {
    fontSize: 14,
    color: "#666",
  },
  itemDetails: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  itemDetail: {
    fontSize: 14,
    color: "#666",
    marginRight: 10,
  },
  differenceText: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 10,
    color: "#007AFF",
  },
  itemType: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  essentialItem: {
    backgroundColor: "#e0f7fa",
    color: "#006064",
  },
  luxuryItem: {
    backgroundColor: "#fce4ec",
    color: "#880e4f",
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  deleteButton: {
    padding: 5,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007AFF",
    width: 120,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    textAlign: "right",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    width: "40%",
    textAlign: "right",
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 5,
    width: "55%",
    textAlign: "center",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    minWidth: "45%",
  },
  cancelButton: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  buttonText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 5,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 3,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  quantityButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
    minWidth: 40,
    textAlign: "center",
  },
  resetButton: {
    backgroundColor: "#f4511e",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  resetButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  wantedAmount: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "bold",
    marginRight: 10,
  },
  activeWantedAmount: {
    color: "#ff6b00",
  },
  lessImportantInput: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ccc",
  },
  purchasedQuantity: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#007AFF",
    marginTop: 2,
  },
  finishShoppingButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    marginTop: 8,
    alignSelf: "center",
  },
  finishShoppingButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 14,
  },
});

export default ShoppingListScreen;
