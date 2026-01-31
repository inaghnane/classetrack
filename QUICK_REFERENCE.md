# 🎓 Hierarchical Navigation - Quick Reference Guide

## Current Status: ✅ FULLY OPERATIONAL

**Server Running:** http://localhost:3001  
**Professor Dashboard:** http://localhost:3001/prof  
**API Endpoint:** http://localhost:3001/api/prof/hierarchy  

---

## The 5 Navigation Levels

```
Level 1: Choose Filière (degree program)
    ↓
Level 2: Choose Module (course within filière)
    ↓
Level 3: Choose Groupe (student group within module)
    ↓
Level 4: Choose Seance (session within groupe)
    ↓
Level 5: Manage Seance (QR, attendance, PDF)
```

---

## At Level 5 - What Can You Do?

### When Seance is OPEN:
- 🔍 Display QR code to students
- ❄️ Freeze/Unfreeze QR (if needed)
- 📋 Check live attendance (before closing)
- 🔒 Close seance when done

### When Seance is CLOSED:
- 👥 View final attendance list
- 📄 Download PDF report
- 📊 See statistics (present/absent count)

### Always Available:
- 👀 View attendance (present/absent lists)
- ⬅️ Go back to seances list
- 🔙 Breadcrumb navigation to any previous level

---

## How the Breadcrumb Works

**Example Path:** `Filières → Informatique → Web Dev → Group 1A → 09:00`

- Click `Filières` → Back to Level 1
- Click `Informatique` → Back to Level 2  
- Click `Web Dev` → Back to Level 3
- Click `Group 1A` → Back to Level 4
- Click `09:00` → You're here

---

## QR Code Details

- ✅ **Generates automatically** when seance opens
- 🔄 **Rotates every 3 seconds** (new token each time)
- ⏱️ **Valid for 5 minutes** (±100 3-second windows)
- ❄️ **Can be frozen** if students have camera issues
- 📱 **Students scan** with their phones to mark attendance

---

## Button Reference

| Button | Where | Action |
|--------|-------|--------|
| `❄️ Geler QR` | Level 5, Open seance | Freeze QR display |
| `☀️ Dégeler` | Level 5, Open seance | Unfreeze QR |
| `Clôturer cette séance` | Level 5, Open seance | Close seance |
| `📄 Télécharger rapport` | Level 5, Closed seance | Download PDF |
| `Voir les présences` | Level 5 | Show/hide attendance |
| `← Retour aux séances` | Level 5 | Back to Level 4 |

---

## File Structure

```
app/prof/page.tsx (408 lines)
├─ Interfaces: Seance, Groupe, Module, Filiere
├─ State: 5 navigation + 3 display states
└─ Renders: 5-level navigation UI

app/api/prof/hierarchy/route.ts
├─ GET endpoint
├─ Auth: Requires PROF role
└─ Returns: Hierarchical data structure
```

---

## Testing Checklist

- ✅ API returns 200 status
- ✅ Component compiles without errors
- ✅ All 5 levels navigate correctly
- ✅ Breadcrumbs work as back buttons
- ✅ QR generates and rotates
- ✅ Freeze/unfreeze works
- ✅ Attendance displays correctly
- ✅ PDF downloads for closed seances
- ✅ Security enforced (professor only)
- ✅ Performance acceptable

---

## Common Tasks

### View a Student's Attendance
1. Navigate: Filière → Module → Groupe → Seance
2. At Level 5, click `Voir les présences`
3. Find student in green (présent) or red (absent) list

### Download Attendance Report
1. Navigate to closed seance (Level 5)
2. Click `📄 Télécharger le rapport (PDF)`
3. Report opens in new tab with print dialog

### Check Live Attendance (Before Closing)
1. Seance must be OPEN
2. Click `Voir les présences`
3. Check present/absent counts
4. More students may join as QR rotates

### Freeze QR (If Technical Issues)
1. At Level 5 with open seance
2. Click `❄️ Geler QR`
3. QR stops changing every 3 seconds
4. Same QR shows to all students
5. Click `☀️ Dégeler` to resume rotation

---

## Tips & Tricks

💡 **Tip 1:** Breadcrumb is your friend - click any level to jump back

💡 **Tip 2:** QR changes every 3 seconds for security

💡 **Tip 3:** Freeze QR only if students have camera issues

💡 **Tip 4:** Always close seance to generate PDF

💡 **Tip 5:** Device binding prevents students from using multiple devices

---

## Troubleshooting

**Problem:** Students can't scan QR
- ✓ Check seance status = OPEN
- ✓ Check QR not frozen (if frozen, unfreeze)
- ✓ Try reloading page

**Problem:** PDF doesn't download
- ✓ Seance must be CLOSED
- ✓ May open in browser tab instead - check tabs

**Problem:** Attendance list empty
- ✓ No students scanned yet
- ✓ Check if seance is OPEN
- ✓ Wait for students to scan

**Problem:** Back button not working
- ✓ Use breadcrumb instead
- ✓ Click previous level name to go back

---

## URLs to Know

| Page | URL |
|------|-----|
| Professor Dashboard | http://localhost:3001/prof |
| API Hierarchy | http://localhost:3001/api/prof/hierarchy |
| Login | http://localhost:3001/login |
| Home | http://localhost:3001 |

---

## Features Summary

✅ **5-Level Navigation:** Drill down through hierarchy  
✅ **QR Codes:** 3-second rotation, 5-minute validity  
✅ **QR Control:** Freeze/unfreeze for emergencies  
✅ **Attendance:** View live during session  
✅ **PDF Reports:** Download after closing  
✅ **Device Binding:** Anti-cheating security  
✅ **Breadcrumbs:** Easy navigation back  
✅ **Responsive Design:** Works on all screen sizes  

---

## System Status

- ✅ Server: Running
- ✅ API: Responding (200 status)
- ✅ Database: Connected
- ✅ Authentication: Active
- ✅ All Features: Working

**Status:** 🟢 READY FOR PRODUCTION

---

*Last Updated: January 30, 2026*  
*Status: ✅ All Systems Operational*
