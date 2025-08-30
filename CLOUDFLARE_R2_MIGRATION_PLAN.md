# 🚀 Cloudflare R2 Migration Plan
**From Appwrite Storage to Cloudflare R2 - Complete Migration Strategy**

## 📋 **Migration Overview**

**Current State:** Using Appwrite Storage (2GB limit)  
**Target State:** Cloudflare R2 with unlimited scalable storage  
**Migration Type:** Gradual migration with backup safety nets  
**Estimated Duration:** 2-3 weeks (depending on data volume)  
**Risk Level:** Medium (with proper backups and testing)

---

## 🎯 **Phase 0: Pre-Migration Planning & Backup**
*Duration: 2-3 days*

### **Task 0.1: Environment Analysis**
- [ ] **Inventory Current Files**
  - Count total files in Appwrite storage
  - Calculate total storage used
  - Identify file types and sizes
  - Document file naming patterns

- [ ] **Create File Inventory Script**
  - Script to list all files with metadata
  - Export file list to CSV for tracking
  - Verify file accessibility and permissions
  - Document any corrupted or missing files

### **Task 0.2: Backup Strategy Implementation**
- [ ] **Primary Backup: Download All Files**
  - Create backup script to download ALL files from Appwrite
  - Organize backup in local directory structure: `backup/[studentId]/[sessionId]/[filename]`
  - Verify file integrity after download (checksums)
  - Store backup on external drive/cloud backup service

- [ ] **Database Backup**
  - Full Appwrite database export
  - Focus on sessions collection (contains file references)
  - Backup file metadata and relationships
  - Store multiple copies (local + cloud)

- [ ] **Configuration Backup**
  - Current `fileService.js` implementation
  - Environment variables and configs
  - Appwrite bucket settings and permissions
  - Any file-related API routes

### **Task 0.3: Risk Assessment & Rollback Plan**
- [ ] **Document Rollback Procedures**
  - Steps to revert to Appwrite storage
  - File restoration process from backups
  - Database restoration procedures
  - Emergency contact procedures

- [ ] **Test Backup Integrity**
  - Randomly verify 10% of backed up files
  - Ensure files open correctly
  - Verify file sizes match originals
  - Test backup restoration process

---

## 🛠️ **Phase 1: R2 Setup & Development Environment**
*Duration: 3-4 days*

### **Task 1.1: Cloudflare R2 Configuration**
- [ ] **Create R2 Bucket**
  - Set up Cloudflare account (if needed)
  - Create R2 bucket: `speechtrack-session-files`
  - Configure bucket permissions and settings
  - Set up custom domain (optional but recommended)

- [ ] **API Keys & Authentication**
  - Generate R2 API tokens
  - Set up access credentials securely
  - Configure environment variables
  - Test basic R2 connectivity

- [ ] **CORS Configuration**
  - Set up CORS for web uploads
  - Configure allowed origins for your domain
  - Test browser-based file uploads
  - Ensure preview functionality works

### **Task 1.2: Development Environment Setup**
- [ ] **R2 SDK Installation**
  - Install AWS SDK (R2 is S3-compatible)
  - Set up development dependencies
  - Configure SDK with R2 credentials
  - Test basic upload/download operations

- [ ] **Create R2 FileService**
  - New `fileServiceR2.js` alongside existing
  - Implement upload, download, delete functions
  - Maintain same interface as existing fileService
  - Add presigned URL generation for secure access

### **Task 1.3: Environment Variables & Configuration**
- [ ] **Add R2 Configuration**
  ```
  CLOUDFLARE_R2_ENDPOINT=
  CLOUDFLARE_R2_ACCESS_KEY_ID=
  CLOUDFLARE_R2_SECRET_ACCESS_KEY=
  CLOUDFLARE_R2_BUCKET_NAME=speechtrack-session-files
  USE_R2_STORAGE=false (feature flag)
  ```

- [ ] **Feature Toggle Implementation**
  - Environment variable to switch between Appwrite and R2
  - Allows testing without affecting production
  - Easy rollback mechanism

---

## 🧪 **Phase 2: Testing & Validation**
*Duration: 4-5 days*

### **Task 2.1: Unit Testing**
- [ ] **R2 FileService Testing**
  - Test file upload with different file types
  - Test file download and preview URLs
  - Test file deletion
  - Test error handling and edge cases

- [ ] **Integration Testing**
  - Test with actual session creation
  - Upload files through admin interface
  - Verify files appear in R2 bucket
  - Test file preview in admin and parent dashboards

### **Task 2.2: Security Testing**
- [ ] **Access Control Verification**
  - Ensure parents can only access their own files
  - Test expired presigned URL handling
  - Verify admin-only file access
  - Test file URL security

- [ ] **Performance Testing**
  - Compare upload speeds: Appwrite vs R2
  - Test large video file handling
  - Measure preview load times
  - Test concurrent upload scenarios

### **Task 2.3: User Experience Testing**
- [ ] **Admin Interface Testing**
  - Test file uploads in session edit page
  - Verify file preview functionality
  - Test file deletion and management
  - Ensure mobile responsiveness

- [ ] **Parent Dashboard Testing**
  - Test file viewing in parent dashboard
  - Verify download functionality
  - Test video streaming capabilities
  - Ensure appropriate files are hidden

---

## 📊 **Phase 3: Gradual Migration Strategy**
*Duration: 1-2 weeks (depending on data volume)*

### **Task 3.1: Migration Script Development**
- [ ] **Create Migration Tools**
  - Script to copy files from Appwrite to R2
  - Batch processing to handle large volumes
  - Progress tracking and resumable transfers
  - Error handling and retry logic

- [ ] **File Verification System**
  - Checksum verification after transfer
  - Size comparison between source and destination
  - Corruption detection and reporting
  - Failed transfer retry mechanism

### **Task 3.2: Phased File Migration**
- [ ] **Phase 3A: New Files Only** *(1-2 days)*
  - Enable R2 for NEW file uploads only
  - Old files remain in Appwrite temporarily
  - Monitor for any issues with new uploads
  - Test mixed storage scenario

- [ ] **Phase 3B: Recent Files Migration** *(2-3 days)*
  - Migrate files from last 30 days first
  - Update database references to R2 URLs
  - Verify migrated files work correctly
  - Keep Appwrite files as backup temporarily

- [ ] **Phase 3C: Historical Files Migration** *(5-7 days)*
  - Migrate remaining files by date ranges
  - Process oldest files last (lower priority)
  - Batch process to avoid API rate limits
  - Continuous verification of migrated files

### **Task 3.3: Database URL Updates**
- [ ] **URL Migration Strategy**
  - Script to update file URLs in database
  - Convert Appwrite URLs to R2 URLs
  - Maintain URL mapping for rollback
  - Test URL conversion accuracy

---

## 🔄 **Phase 4: Full Cutover & Validation**
*Duration: 2-3 days*

### **Task 4.1: Complete Migration**
- [ ] **Final Migration Steps**
  - Migrate any remaining files
  - Update all database references
  - Remove Appwrite storage dependencies from code
  - Update environment configurations

- [ ] **System-Wide Testing**
  - Full regression testing of file functionality
  - Test all user scenarios (admin + parent)
  - Verify all file types work correctly
  - Performance validation

### **Task 4.2: Production Deployment**
- [ ] **Code Deployment**
  - Deploy R2-only version to production
  - Update environment variables
  - Remove feature flags
  - Monitor for any issues

- [ ] **Post-Deployment Validation**
  - Verify all existing files accessible
  - Test new file uploads
  - Monitor error rates and performance
  - User acceptance testing

---

## 🧹 **Phase 5: Cleanup & Optimization**
*Duration: 1-2 days*

### **Task 5.1: Code Cleanup**
- [ ] **Remove Old Code**
  - Remove Appwrite storage dependencies
  - Clean up old fileService.js
  - Remove unused environment variables
  - Update documentation

### **Task 5.2: Monitoring & Optimization**
- [ ] **Set Up Monitoring**
  - Monitor R2 costs and usage
  - Set up alerts for errors
  - Track file access patterns
  - Performance monitoring

- [ ] **Cost Optimization**
  - Review storage classes if needed
  - Optimize file access patterns
  - Set up lifecycle rules if applicable
  - Monitor egress patterns

---

## 🚨 **Emergency Procedures & Rollback Plan**

### **Immediate Rollback (if needed during migration)**
1. **Stop Migration Process**
   - Halt any running migration scripts
   - Switch feature flag back to Appwrite
   - Verify no data corruption occurred

2. **Restore Service**
   - Revert to previous code version
   - Restore original environment variables
   - Test basic file operations
   - Verify user access restored

3. **Investigate Issues**
   - Analyze what went wrong
   - Fix identified issues
   - Plan retry strategy
   - Update migration procedures

### **File Recovery Procedures**
1. **From R2 Backup**
   - Files already in R2 can be downloaded
   - Use R2 SDK to bulk download if needed
   - Verify file integrity after recovery

2. **From Local Backup**
   - Use local backup files created in Phase 0
   - Upload to Appwrite storage if needed
   - Verify database references match files

---

## ✅ **Success Criteria & Validation**

### **Migration Success Indicators:**
- [ ] All files accessible through new R2 URLs
- [ ] No file corruption or data loss
- [ ] Parent dashboard functions normally
- [ ] Admin file management works correctly
- [ ] Performance equal or better than before
- [ ] Costs reduced compared to Appwrite scaling

### **Validation Checklist:**
- [ ] **File Upload:** New files upload successfully to R2
- [ ] **File Preview:** All file types preview correctly
- [ ] **File Download:** Downloads work for all users
- [ ] **Security:** Access controls working properly
- [ ] **Performance:** No significant slowdowns
- [ ] **Cost:** R2 costs tracking within expectations

---

## 🛠️ **Tools & Scripts Needed**

### **Migration Scripts:**
- `backup-appwrite-files.js` - Download all files locally
- `inventory-files.js` - Create file inventory
- `migrate-to-r2.js` - Transfer files to R2
- `verify-migration.js` - Verify file integrity
- `update-database-urls.js` - Update file URLs in database

### **Monitoring Tools:**
- File transfer progress tracker
- Error logging and reporting
- Cost monitoring dashboard
- Performance monitoring

### **Testing Tools:**
- Automated file upload/download tests
- Security access control tests
- Performance benchmark tools
- User experience validation scripts

---

## 📅 **Recommended Timeline**

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 0** | 2-3 days | Complete backup, risk assessment |
| **Phase 1** | 3-4 days | R2 setup, development environment |
| **Phase 2** | 4-5 days | Comprehensive testing |
| **Phase 3** | 1-2 weeks | Gradual file migration |
| **Phase 4** | 2-3 days | Full cutover, validation |
| **Phase 5** | 1-2 days | Cleanup, optimization |
| **Total** | **2-3 weeks** | Complete migration |

---

## 💰 **Cost Analysis**

### **Current Appwrite Costs:**
- Storage: 2GB limit (hitting ceiling)
- Scaling: Expensive beyond free tier

### **Projected R2 Costs:**
- **10GB Storage:** $0.15/month
- **100GB Storage:** $1.50/month  
- **1TB Storage:** $15.00/month
- **Operations:** ~$0.50/month (estimated)
- **Egress:** FREE (major advantage)

### **ROI Calculation:**
- **Break-even:** Almost immediate
- **Annual Savings:** $100-500+ (depending on growth)
- **Scalability:** Unlimited without cost anxiety

---

## 📞 **Support & Resources**

### **Documentation:**
- Cloudflare R2 API docs
- AWS S3 SDK documentation (compatibility)
- Node.js file handling best practices

### **Emergency Contacts:**
- Developer team lead
- Cloudflare support
- Backup service provider

### **Key Files to Monitor:**
- `lib/fileService.js` (current)
- `lib/fileServiceR2.js` (new)
- Database sessions collection
- Environment configurations

---

**🎯 This migration plan prioritizes safety through comprehensive backups, gradual migration, and multiple rollback options while achieving significant cost savings and unlimited scalability.**
