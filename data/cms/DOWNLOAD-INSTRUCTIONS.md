# CMS Data Download Instructions

Follow these steps to download the real CMS healthcare marketplace data files needed for accurate calculator functionality.

---

## Quick Start Checklist

- [ ] Download Service Area PUF (File 1)
- [ ] Download Rate PUF (File 2)
- [ ] Download HUD ZIP-County Crosswalk (File 3)
- [ ] Download QHP Landscape (File 4 - Optional)
- [ ] Place files in `data/cms/raw/` directory
- [ ] Run processing: `npm run process:cms`
- [ ] Import to database: `npm run import:cms`

**Total Download Size:** ~450 MB
**Total Time:** 15-30 minutes

---

## File 1: Service Area PUF (County → Rating Area Mapping)

### What It Contains
- All 3,143 US counties
- CMS rating area assignments
- ZIP code to county mappings
- Service area coverage by insurer

### Download Steps

1. **Visit CMS Marketplace PUF Portal**
   ```
   https://www.cms.gov/marketplace/resources/data/public-use-files
   ```

2. **Select Plan Year**
   - Choose: **Plan Year 2024** (or latest available)
   - Scroll to "Service Area Public Use File (SA-PUF)"

3. **Download the ZIP Archive**
   - File name: `SA-PUF-2024.zip`
   - Size: ~1.3 MB
   - Click download link

4. **Extract the CSV**
   - Unzip the archive
   - Find the CSV file inside (e.g., `ServiceArea_PUF_2024.csv`)
   - Rename to: `service-area-2024.csv`

5. **Place in Data Directory**
   ```bash
   # Create directory if it doesn't exist
   mkdir -p data/cms/raw

   # Move extracted file
   mv ~/Downloads/ServiceArea_PUF_2024.csv data/cms/raw/service-area-2024.csv
   ```

### File Format
```csv
StateCode,CountyFIPS,ZIPCode,IssuerID,ServiceAreaID,ServiceAreaName
CA,06037,90001,53517,CAS001,Los Angeles Service Area
```

---

## File 2: Rate PUF (SLCSP Benchmark Pricing)

### What It Contains
- Age-based premium rates for all plans
- Rating area pricing
- Metal tier information (Bronze, Silver, Gold, Platinum)
- Tobacco surcharge rates

### Download Steps

1. **Visit CMS Marketplace PUF Portal** (same as above)
   ```
   https://www.cms.gov/marketplace/resources/data/public-use-files
   ```

2. **Select Plan Year**
   - Choose: **Plan Year 2024** (or latest)
   - Scroll to "Rate Public Use File (Rate-PUF)"

3. **Download the ZIP Archive**
   - File name: `Rate-PUF-2024.zip`
   - Size: **~342 MB** (large file!)
   - Click download link
   - **Note:** This may take several minutes to download

4. **Extract the CSV**
   - Unzip the archive
   - Find the CSV file (e.g., `Rate_PUF_2024.csv`)
   - Rename to: `rate-2024.csv`

5. **Place in Data Directory**
   ```bash
   mv ~/Downloads/Rate_PUF_2024.csv data/cms/raw/rate-2024.csv
   ```

### File Format
```csv
StateCode,RatingArea,Age,IndividualRate,IndividualTobaccoRate,Couple,MetalLevel
CA,7,21,310.45,372.54,620.90,Silver
CA,7,27,339.12,406.94,678.24,Silver
```

**Important:** This file is very large (2+ million rows). Processing may take a few minutes.

---

## File 3: HUD ZIP-County Crosswalk

### What It Contains
- 40,000+ US ZIP codes
- County FIPS mappings
- Residential/business/total ratios

### Download Steps

1. **Visit HUD USPS Crosswalk Portal**
   ```
   https://www.huduser.gov/apps/public/uspscrosswalk/login
   ```

   **Note:** Despite "login" in URL, no authentication is required

2. **Select Quarter**
   - Choose: **Q4 2024** (or latest available)
   - From dropdown menu at top

3. **Select Crosswalk Type**
   - Choose: **ZIP-COUNTY**
   - From the crosswalk type dropdown

4. **Select Format**
   - Choose: **CSV** (preferred) or Excel
   - Click "Download" button

5. **Save the File**
   - File name: `ZIP_COUNTY_092024.csv` (date varies)
   - Size: ~5-10 MB
   - Rename to: `hud-zip-county-2024.csv`

6. **Place in Data Directory**
   ```bash
   mv ~/Downloads/ZIP_COUNTY_092024.csv data/cms/raw/hud-zip-county-2024.csv
   ```

### File Format
```csv
ZIP,COUNTY,RES_RATIO,BUS_RATIO,OTH_RATIO,TOT_RATIO
90001,06037,1.0,1.0,1.0,1.0
90210,06037,1.0,1.0,0.0,0.95
```

**Notes:**
- Some ZIP codes span multiple counties (multiple rows for same ZIP)
- `TOT_RATIO` indicates allocation percentage
- Use ratios to determine primary county

---

## File 4: QHP Landscape (Carrier Participation) - OPTIONAL

### What It Contains
- Insurance carriers by county
- Plan counts and types
- Network information
- Metal tier availability

### Download Steps

1. **Visit Healthcare.gov Data Portal**
   ```
   https://data.healthcare.gov/datasets
   ```

2. **Search for QHP Landscape**
   - In search box, type: **"QHP Landscape 2024"**
   - Filter by: Individual Market Medical

3. **Select the Dataset**
   - Full title: "Individual Market Qualified Health Plan Landscape"
   - Plan Year: 2024

4. **Download the CSV**
   - File name: `2024-QHP-Landscape-Individual-Market-Medical.csv`
   - Size: **~100-150 MB** (large file)
   - Click "Download" or "Export"

5. **Place in Data Directory**
   ```bash
   mv ~/Downloads/2024-QHP-Landscape-Individual-Market-Medical.csv data/cms/raw/qhp-landscape-2024.csv
   ```

### File Format
```csv
StateCode,CountyName,IssuerId,IssuerName,MetalLevel,PlanType,NetworkType,PlanMarketingName
CA,Los Angeles,53517,Blue Shield of California,Silver,HMO,Regional,Blue Shield Silver 70
```

**Note:** This file is OPTIONAL. If skipped, carrier data will not be imported, but calculator will still function.

---

## Verify Your Downloads

After downloading all files, verify they're in the correct location:

```bash
ls -lh data/cms/raw/
```

**Expected Output:**
```
service-area-2024.csv      ~1.3 MB
rate-2024.csv              ~350 MB
hud-zip-county-2024.csv    ~10 MB
qhp-landscape-2024.csv     ~150 MB  (optional)
```

---

## Process the Data

Once all files are downloaded:

```bash
# Step 1: Process raw files into importable format
npm run process:cms

# This will create processed files in data/cms/:
# - county-rating-areas.csv
# - slcsp-benchmarks.csv
# - zip-county-mapping.csv
# - carrier-participation.csv (if QHP Landscape was included)
```

**Processing Time:** 5-10 minutes

---

## Import to Database

After processing completes:

```bash
# Step 2: Import processed data to database
npm run import:cms

# Step 3: Validate import
npm run import:cms:validate
```

**Import Time:** 5-10 minutes

**Expected Results:**
```
✅ Counties: 3,143
✅ ZIP Codes: 40,000+
✅ SLCSP Records: 500+
✅ Carriers: Varies by state
```

---

## Troubleshooting

### "File not found" Error
- Check file is in `data/cms/raw/` directory
- Verify file name matches exactly (case-sensitive)
- Ensure file was fully downloaded (check file size)

### "Invalid CSV format" Error
- Open file in text editor to verify it's CSV (not HTML error page)
- Check first few lines match expected format above
- Re-download if file appears corrupted

### Download Link Not Working
- CMS updates URLs occasionally
- Try searching: "CMS Marketplace PUF 2024" in Google
- Or visit main CMS data portal: https://www.cms.gov/data

### Files Too Large
- Rate PUF is 342 MB - ensure you have space
- QHP Landscape is 150 MB
- Total: ~500 MB disk space needed

### Slow Download
- CMS servers can be slow during peak hours
- Try downloading during off-peak (evening/weekend)
- Use download manager for resume capability

---

## Alternative: Use Sample Data

If you prefer to start with sample data before downloading full CMS files:

```bash
# Use pre-created sample data (top 10 states)
cp data/samples/cms/*.csv data/cms/

# Import sample data
npm run import:cms
```

**Limitations of Sample Data:**
- Only 58 counties (vs 3,143)
- Only 60 ZIP codes (vs 40,000+)
- Estimated SLCSP (not official CMS benchmarks)
- Top 10 states only

---

## Data Update Schedule

**CMS Updates:** Quarterly
- Q1: January-March data
- Q2: April-June data
- Q3: July-September data
- Q4: October-December data

**Recommended Refresh:** Quarterly (download new files and re-import)

**Automated Updates:** See `scripts/download-cms-data.sh` (coming soon)

---

## Additional Resources

- **CMS Data Dictionary:** Included with each PUF download
- **HUD Crosswalk Documentation:** https://www.huduser.gov/portal/datasets/usps/ZIP_COUNTY_032024.pdf
- **Healthcare.gov API:** https://developer.cms.gov/marketplace-api/
- **Questions?** See `lib/data-import/README.md`

---

## Summary

**Minimum Required Files:**
1. ✅ Service Area PUF (~1.3 MB)
2. ✅ Rate PUF (~342 MB)
3. ✅ HUD ZIP-County Crosswalk (~10 MB)

**Optional:**
4. ⭕ QHP Landscape (~150 MB) - For carrier data

**Total Time:** 20-30 minutes for download + 10-15 minutes for processing/import

**Result:** 100% accurate calculator with real CMS data for all 50 states!
