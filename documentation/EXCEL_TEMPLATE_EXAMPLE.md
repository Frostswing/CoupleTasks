# Excel Template Example for Task Table Import

## Overview

This document provides a template and examples for creating Excel files that can be imported into the CoupleTasks Task Table feature.

## Template Structure

Create an Excel file (`.xlsx` or `.xls`) with the following 9 columns in this exact order (from right to left in Hebrew):

| Column # | Hebrew Name | English Translation | Description | Example Values |
|----------|-------------|-------------------|-------------|----------------|
| 9 | קטגוריה | Category | Main task category | ניקיון, כביסה, תחזוקה שוטפת |
| 8 | תת-קטגוריה | Subcategory | Specific area or room | כללי, מטבח, שירותים |
| 7 | מטלה | Task Name | Name of the task | שטיפת רצפה, הפעלת מכונה |
| 6 | מי מבצע | Performer (Planned) | Who will do it | ביחד, עדן הבן, עדן הבת |
| 5 | משך המטלה | Duration (Planned) | How long it takes | רבע שעה, חצי שעה, 10 דקות |
| 4 | תדירות | Frequency (Planned) | How often | פעם בשבוע, יומיומי |
| 3 | מי מבצע | Performer (Current) | Who currently does it | ביחד, עדן הבן, עדן הבת |
| 2 | משך המטלה | Duration (Current) | Current duration | רבע שעה, חצי שעה |
| 1 | תדירות | Frequency (Current) | Current frequency | פעם בשבוע, יומיומי |

**Note:** The system uses the **Planned** columns (4, 5, 6) for generating tasks. Current columns (1, 2, 3) are for documentation only.

## Complete Example Table

```
קטגוריה | תת-קטגוריה | מטלה | מי מבצע (תכנון) | משך המטלה (תכנון) | תדירות (תכנון) | מי מבצע (נוכחי) | משך המטלה (נוכחי) | תדירות (נוכחי)
---------|-------------|------|-----------------|-------------------|----------------|-----------------|-------------------|------------------
רכב | כללי | תחזוקת המכונית | ביחד | | פעם בכמה חודשים | ביחד | | פעם בכמה חודשים
ניקיון | כללי | תחזוקת שואב אבק רובוטי | עדן הבן | עשר דקות-חצי שעה | | עדן הבן | | ניקוי שבועי וניקוי חודשי
ניקיון | כללי | שטיפת רצפה | ביחד | עדן הבן: רבע שעה, עדן הבת: חצי שעה | פעם בשבוע-שבועיים | עדן הבן | | פעם בשבוע
ניקיון | כללי | הוצאת אשפה | עדן הבן | דקה | מתי שמתמלא | עדן הבן | | פעם ביומיים-שלושה
ניקיון | סלון | לכבס כיסוי ספה | ביחד | עשרים דקות | פעם בחודש | עדן הבן | | פעם בשבועיים
ניקיון | חדר שינה | החלפת מצעים | ביחד | רבע שעה | פעם בשבוע-שבועיים | עדן הבן | | פעם בשבוע
ניקיון | מטבח | מיחזור | עדן הבן | עשר דקות | מתי שמתמלא | עדן הבן | | פעם ב3 ימים
ניקיון | מטבח | למלא סבון כלים | עדן הבן | שתי דקות | פעם בשבוע-שבועיים | עדן הבן | | פעם בשבוע
ניקיון | שירותים | ניקוי חדרי שירותים | ביחד | עדן הבן: רבע שעה, עדן הבת: חצי שעה | פעם בשבוע-שבועיים | עדן הבן | | פעם בשבוע
ניקיון | שירותים | למלא סבון גוף | ביחד | שלוש דקות | פעם בשבוע-שבועיים | עדן הבן | | פעם בשבוע
ניקיון | שירותים | למלא סבון ידיים | ביחד | שלוש דקות | פעם בשבוע-שבועיים | עדן הבן | | פעם בשבוע
ניקיון | שירותים | למלא נייר טואלט | ביחד | חמש דקות | פעם בשבוע-שבועיים | עדן הבן | | פעם בשבוע
כביסה | מקלט | הפעלת מכונה | ביחד | חמש דקות | מתי שמתמלא | עדן הבן | | פעם ביומיים
כביסה | מקלט | הורדת כביסה | ביחד | חמש דקות | מתי שמתמלא | עדן הבן | | פעם ביומיים
כביסה | מקלט | תליית כביסה | ביחד | רבע שעה | מתי שמתמלא | עדן הבן | | פעם ביומיים
כביסה | כללי | קיפול כביסה | בנפרד | | עדן הבן: פעם בחודשיים, עדן הבת: פעמיים בשבוע | ביחד | | כשהסל כביסה נקייה מגיע ל3/4
כביסה | כללי | סידור בגדים בארונות | בנפרד | | | ביחד | | ביחד עם קיפול כביסה
כביסה | כללי | החלפת מגבות | בנפרד | | פעם בשבוע-שבועיים | עדן הבן | | פעם בשבוע
תחזוקה שוטפת | כללי | לערוך רשימת קניות | עדן הבת | רבע שעה-עשרים דקות | | ביחד | | 
תחזוקה שוטפת | כללי | קניות | ביחד | שעה וחצי-שעתיים | פעם בשבועיים | עדן הבן | | פעמיים בשבוע
תחזוקה שוטפת | כללי | קניית חומרי ניקוי | עדן הבת | | פעם בכמה חודשים | עדן הבן | | פעם בכמה חודשים
תחזוקה שוטפת | כללי | קניית כלים | ביחד | | | ביחד | | 
תחזוקה שוטפת | כללי | קניית מוצרי חשמל | ביחד | | לפי הצורך | ביחד | | לפי הצורך
תחזוקה שוטפת | כללי | השקיית עציצים | ביחד | | עדן הבן: תמלא פה, עדן הבת: פעם בשבוע-שבוע וחצי | עדן הבן | | עדן הבן: פעם בשבוע וחצי, עדן הבת: פעם בשבוע-שבוע וחצי
תחזוקה שוטפת | כללי | תיקונים בבית | ביחד | | לפי הצורך | ביחד | | לפי הצורך
תחזוקה שוטפת | כללי | עבודות קטנות | ביחד | | לפי הצורך | ביחד | | לפי הצורך
תחזוקה שוטפת | כללי | החלפת נורות | עדן הבן | | לפי הצורך | ביחד | | לפי הצורך
תחזוקה שוטפת | כללי | תיקון מכשירי חשמל | עדן הבן | | | עדן הבן | | 
תחזוקה שוטפת | כללי | עבודות בגינה | עדן הבן | | | עדן הבן | | 
חיות מחמד | כללי | לקחת את רובי לטיול | עדן הבן | | יומיומי | עדן הבן | | יומיומי
חיות מחמד | כללי | לקחת את רובי לוטרינר | עדן הבן | | | עדן הבן | | 
חיות מחמד | כללי | לקחת את פוץ לוטרינר | ביחד | | | ביחד | | 
חיות מחמד | כללי | לנקות מזרקת מים | ביחד | | | עדן הבן | | פעם בשבועיים
חיות מחמד | כללי | למלא אוכל לפוץ | עדן הבן | | | עדן הבן | | פעם בחודש
תשלומים וכלכלה | כללי | תשלום קניות בסופר | ביחד | | | ביחד | | 
אוכל | כללי | בישול | ביחד | | | ביחד | | להחליט שבוע שבוע
אוכל | כללי | שטיפת כלים | ביחד | | | ביחד | | 
אוכל | כללי | החזרת כלים יבשים למקום | ביחד | חמש דקות | כל יום-יומיים | ביחד | | כל בוקר
```

## Frequency Patterns Reference

### Daily Frequencies
- `יומיומי` - Daily
- `כל יום` - Every day
- `daily` - Daily (English)

### Multiple Days
- `פעם ביומיים` - Every 2 days
- `פעם ב3 ימים` - Every 3 days
- `every 2 days` - Every 2 days (English)

### Weekly Frequencies
- `פעם בשבוע` - Once a week
- `שבועי` - Weekly
- `פעם בשבועיים` - Every 2 weeks
- `weekly` - Weekly (English)

### Monthly Frequencies
- `פעם בחודש` - Once a month
- `חודשי` - Monthly
- `פעם בחודשיים` - Every 2 months
- `monthly` - Monthly (English)

### Custom/As Needed
- `מתי שמתמלא` - When full
- `לפי הצורך` - As needed
- `as needed` - As needed (English)

## Duration Patterns Reference

### Minutes
- `5 דקות` - 5 minutes
- `עשר דקות` - 10 minutes
- `חמש עשרה דקות` - 15 minutes

### Common Durations
- `רבע שעה` - Quarter hour (15 min)
- `חצי שעה` - Half hour (30 min)
- `שלושת רבעי שעה` - Three quarters hour (45 min)
- `שעה` - One hour
- `שעה וחצי` - Hour and half (90 min)
- `שעתיים` - Two hours

### Combined Durations
- `עשר דקות-חצי שעה` - 10-30 minutes
- `רבע שעה-עשרים דקות` - 15-20 minutes
- `שעה-שעה וחצי` - 1-1.5 hours

## Performer Patterns Reference

### Together
- `ביחד` - Together
- `together` - Together (English)

### Separately
- `בנפרד` - Separately
- `separate` - Separately (English)

### Specific Person
- `עדן הבן` - Person A
- `עדן הבת` - Person B
- Any custom name

### Complex Assignments
- `עדן הבן: רבע שעה, עדן הבת: חצי שעה` - Different durations per person

## Tips for Creating Your Excel File

1. **Copy the header row exactly** - Column names must match
2. **Task name is required** - Column 7 (מטלה) must not be empty
3. **Use planned columns for sync** - Fill columns 4, 5, 6 with your desired configuration
4. **Current columns are optional** - Use for documentation only
5. **Empty cells are OK** - Not all fields need to be filled
6. **Consistent formatting** - Use similar patterns for similar tasks
7. **Test with small file first** - Import 5-10 tasks to verify format

## How to Use This Template

1. Open Excel or Google Sheets
2. Create a new spreadsheet
3. Copy the header row from the example above
4. Add your tasks following the patterns shown
5. Save as `.xlsx` file
6. Import into CoupleTasks app
7. Review imported tasks
8. Tap Sync to generate tasks

## Common Issues

### Issue: Task not imported
- **Check:** Task name (column 7) is not empty
- **Check:** Row is not hidden in Excel

### Issue: Frequency not parsed correctly
- **Solution:** Use standard patterns from reference above
- **Solution:** Avoid complex custom strings

### Issue: Duration shows as null
- **Solution:** Use standard duration patterns
- **Solution:** Ensure Hebrew text is properly encoded

### Issue: Performer not recognized
- **Solution:** Use ביחד, בנפרד, or specific consistent names
- **Solution:** Avoid mixing multiple names in one cell

---

**Last Updated:** November 2024  
**Template Version:** 1.0.0

