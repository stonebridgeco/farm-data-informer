# What You Should See - External Testing Guide

## Expected Application Layout

### 1. Header Section
- **Title:** "Farm Data Informer" with farm icon
- **Subtitle:** "Agricultural Suitability Analysis Platform"
- **Background:** Professional gradient design

### 2. Main Content Area (Split Screen)

#### Left Side - Dashboard (40% width)
- **Tab Navigation:** Status | Counties | Analysis
- **Status Tab (Default):**
  - System Status indicators
  - Data Pipeline status
  - API connectivity status
  - Cache performance metrics

#### Right Side - Interactive Map (60% width)
- **Map Controls:** Zoom in/out buttons, reset view
- **Base Layer:** OpenStreetMap tiles
- **County Boundaries:** Outlined in blue
- **Hover Effects:** Counties highlight on mouse over
- **Click Interaction:** Counties can be selected

### 3. Interactive Features to Test

1. **Map Navigation:**
   - Zoom with mouse wheel or controls
   - Pan by dragging
   - Counties should remain visible at all zoom levels

2. **County Selection:**
   - Click any county to select it
   - Selected county should change color/style
   - Check dashboard for updates

3. **Tab Navigation:**
   - Click "Counties" tab to see county management
   - Click "Analysis" tab to see analysis tools
   - "Status" tab shows system monitoring

## Troubleshooting Common Issues

### Map Not Loading
- **Symptom:** Gray area where map should be
- **Solution:** Wait 15-20 seconds, refresh if needed
- **Check:** Browser console for network errors

### County Boundaries Missing
- **Symptom:** Map loads but no county lines visible
- **Cause:** Large GeoJSON file still downloading (~2MB)
- **Solution:** Wait for network transfer to complete

### Layout Issues
- **Mobile/Tablet:** Layout should stack vertically
- **Desktop:** Should show split-screen design
- **Very Wide Screens:** Content should remain centered

## Performance Expectations

- **Initial Load:** 3-5 seconds for full application
- **Map Tiles:** 1-2 seconds per tile set
- **County Data:** 5-10 seconds (large file)
- **UI Interactions:** Immediate response

## Success Criteria ✅

If you can see and do all of these, the application is working correctly:

1. ✅ Professional header loads
2. ✅ Split-screen layout displays
3. ✅ Map shows with zoom controls
4. ✅ County boundaries appear (may take time)
5. ✅ Tabs can be clicked and switched
6. ✅ Counties can be clicked and highlighted
7. ✅ No major console errors (minor warnings OK)

---

**If anything doesn't work as described above, please:**
1. Note which step failed
2. Check browser console for errors (F12)
3. Try refreshing the page once
4. Report back with specific error messages

**The application is ready for testing at:**
`http://10.0.11.44:3001/`
