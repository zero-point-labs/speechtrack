import { databases, Query, ID } from '@/lib/appwrite.client';
import { appwriteConfig } from '@/lib/appwrite.config';

export class AchievementService {
  
  // Journey Management
  async getJourneyForStudent(studentId) {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.achievementJourneys,
        [
          Query.equal('studentId', studentId),
          Query.equal('isActive', true)
        ]
      );
      
      if (response.documents.length > 0) {
        // Parse the stepConfiguration from JSON string
        const journey = response.documents[0];
        journey.stepConfiguration = JSON.parse(journey.stepConfiguration || '[]');
        return journey;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching journey:', error);
      return null;
    }
  }
  
  async createJourney(studentId, journeyData, createdBy) {
    try {
      console.log('AchievementService.createJourney called with:', {
        studentId,
        journeyData,
        createdBy,
        databaseId: appwriteConfig.databaseId,
        collectionId: appwriteConfig.collections.achievementJourneys
      });
      
      // Ensure createdBy is provided
      if (!createdBy) {
        throw new Error('createdBy is required for creating a journey');
      }
      
      // Ensure collection ID is available
      if (!appwriteConfig.collections.achievementJourneys) {
        throw new Error('Achievement journeys collection ID not configured');
      }
      
      const journey = {
        studentId,
        ...journeyData,
        createdBy,
        isActive: true,
        // Convert stepConfiguration to JSON string for storage
        stepConfiguration: JSON.stringify(journeyData.stepConfiguration || [])
      };
      
      console.log('Creating journey document with data:', journey);
      
      const response = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.achievementJourneys,
        ID.unique(),
        journey
      );
      
      // Parse back the stepConfiguration
      response.stepConfiguration = JSON.parse(response.stepConfiguration);
      return response;
    } catch (error) {
      console.error('Error creating journey:', error);
      throw error;
    }
  }
  
  async updateJourney(journeyId, journeyData) {
    try {
      const dataToUpdate = {
        ...journeyData,
        stepConfiguration: JSON.stringify(journeyData.stepConfiguration || [])
      };
      
      const response = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.achievementJourneys,
        journeyId,
        dataToUpdate
      );
      
      response.stepConfiguration = JSON.parse(response.stepConfiguration);
      return response;
    } catch (error) {
      console.error('Error updating journey:', error);
      throw error;
    }
  }
  
  async updateJourneyStep(journeyId, stepNumber, updateData) {
    try {
      // Get current journey
      const journey = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.achievementJourneys,
        journeyId
      );
      
      // Parse stepConfiguration
      const stepConfiguration = JSON.parse(journey.stepConfiguration || '[]');
      
      // Update specific step
      const updatedSteps = stepConfiguration.map(step => {
        if (step.stepNumber === stepNumber) {
          // Handle nested updates (like trophyData.isClaimed)
          if (updateData['trophyData.isClaimed'] !== undefined) {
            return {
              ...step,
              trophyData: {
                ...step.trophyData,
                isClaimed: updateData['trophyData.isClaimed']
              }
            };
          }
          if (updateData['trophyData.claimedAt'] !== undefined) {
            return {
              ...step,
              trophyData: {
                ...step.trophyData,
                claimedAt: updateData['trophyData.claimedAt']
              }
            };
          }
          return { ...step, ...updateData };
        }
        return step;
      });
      
      // Update journey
      const response = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.achievementJourneys,
        journeyId,
        {
          stepConfiguration: JSON.stringify(updatedSteps)
        }
      );
      
      response.stepConfiguration = JSON.parse(response.stepConfiguration);
      return response;
    } catch (error) {
      console.error('Error updating journey step:', error);
      throw error;
    }
  }
  
  // Progress Calculation
  async calculateStepProgress(step, completedSessions) {
    console.log(`🔍 Calculating progress for step ${step.stepNumber}:`);
    console.log(`   📝 Step session IDs:`, step.sessionIds);
    console.log(`   ✅ Completed sessions:`, completedSessions);
    
    const completedInStep = step.sessionIds.filter(sessionId => {
      const isCompleted = completedSessions.includes(sessionId);
      console.log(`   🔍 Session ${sessionId} completed:`, isCompleted);
      return isCompleted;
    }).length;
    
    console.log(`   📊 Completed in step: ${completedInStep}/${step.sessionIds.length}`);
    
    const progressPercentage = (completedInStep / step.requiredCompletionCount) * 100;
    const isStepCompleted = completedInStep >= step.requiredCompletionCount;
    
    return {
      completedSessions: completedInStep,
      totalSessions: step.sessionIds.length,
      requiredSessions: step.requiredCompletionCount,
      progressPercentage: Math.min(progressPercentage, 100),
      isCompleted: isStepCompleted,
      canClaim: isStepCompleted && step.hasTrophy && step.trophyData && !step.trophyData.isClaimed
    };
  }
  
  async getCompletedSessions(studentId) {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessions,
        [
          Query.equal('studentId', studentId),
          Query.equal('status', 'completed')
        ]
      );
      
      return response.documents.map(session => session.$id);
    } catch (error) {
      console.error('Error fetching completed sessions:', error);
      return [];
    }
  }
  
  // Check and update step completion status
  async checkAndUpdateStepCompletion(journeyId, stepNumber, completedSessions) {
    try {
      const journey = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.achievementJourneys,
        journeyId
      );
      
      const stepConfiguration = JSON.parse(journey.stepConfiguration || '[]');
      const step = stepConfiguration.find(s => s.stepNumber === stepNumber);
      
      if (!step) return null;
      
      const progress = await this.calculateStepProgress(step, completedSessions);
      
      if (progress.isCompleted && !step.isCompleted) {
        // Step just completed
        const completedAt = new Date().toISOString();
        
        await this.updateJourneyStep(journeyId, stepNumber, {
          isCompleted: true,
          completedAt: completedAt
        });
        
        // If step has trophy, mark it as earned
        if (step.hasTrophy && step.trophyData) {
          await this.updateJourneyStep(journeyId, stepNumber, {
            'trophyData.isEarned': true,
            'trophyData.earnedAt': completedAt
          });
        }
        
        // Unlock next step
        await this.unlockNextStep(journeyId, stepNumber);
        
        return { stepCompleted: true, completedAt };
      }
      
      return { stepCompleted: false };
    } catch (error) {
      console.error('Error checking step completion:', error);
      return null;
    }
  }
  
  // Trophy Management
  async claimTrophy(journeyId, stepNumber) {
    try {
      const claimTime = new Date().toISOString();
      
      await this.updateJourneyStep(journeyId, stepNumber, {
        'trophyData.isClaimed': true,
        'trophyData.claimedAt': claimTime
      });
      
      return { success: true, claimedAt: claimTime };
    } catch (error) {
      console.error('Error claiming trophy:', error);
      throw error;
    }
  }
  
  async unlockNextStep(journeyId, completedStepNumber) {
    const nextStepNumber = completedStepNumber + 1;
    
    try {
      await this.updateJourneyStep(journeyId, nextStepNumber, {
        unlockedAt: new Date().toISOString()
      });
    } catch (error) {
      // Next step might not exist, which is fine
      console.log(`No step ${nextStepNumber} to unlock`);
    }
  }
  
  // Template Management
  async getJourneyTemplates(category = null, ageGroup = null) {
    try {
      const queries = [Query.equal('isPublic', true)];
      
      if (category) {
        queries.push(Query.equal('category', category));
      }
      
      if (ageGroup) {
        queries.push(Query.equal('ageGroup', ageGroup));
      }
      
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.journeyTemplates,
        queries
      );
      
      // Parse templateSteps for each template
      return response.documents.map(template => ({
        ...template,
        templateSteps: JSON.parse(template.templateSteps || '[]')
      }));
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }
  
  async createTemplate(templateData) {
    try {
      const template = {
        ...templateData,
        templateSteps: JSON.stringify(templateData.templateSteps || []),
        usageCount: 0,
        rating: 0.0
      };
      
      const response = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.journeyTemplates,
        ID.unique(),
        template
      );
      
      response.templateSteps = JSON.parse(response.templateSteps);
      return response;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }
  
  async getTrophyLibrary() {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.trophyLibrary
      );
      
      // Parse availableAnimations for each trophy
      return response.documents.map(trophy => ({
        ...trophy,
        availableAnimations: JSON.parse(trophy.availableAnimations || '[]')
      }));
    } catch (error) {
      console.error('Error fetching trophy library:', error);
      return [];
    }
  }
  
  // Helper method to create journey from template
  async createJourneyFromTemplate(studentId, templateId, customizations = {}) {
    try {
      const template = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.journeyTemplates,
        templateId
      );
      
      const templateSteps = JSON.parse(template.templateSteps || '[]');
      
      // Transform template steps to journey steps
      const stepConfiguration = templateSteps.map((step, index) => ({
        ...step,
        stepNumber: index + 1,
        sessionIds: [],
        isCompleted: false,
        completedAt: null,
        unlockedAt: index === 0 ? new Date().toISOString() : null,
        trophyData: step.hasTrophy ? {
          name: step.trophyName || `${step.title} Trophy`,
          icon: step.trophyIcon || '🏆',
          category: step.trophyCategory || 'milestone',
          animation: step.trophyAnimation || 'confetti',
          unlockMessage: step.trophyMessage || `Great job completing ${step.title}!`,
          backgroundColor: step.trophyBgColor || '#FFD700',
          glowColor: step.trophyGlowColor || '#FFF',
          isEarned: false,
          earnedAt: null,
          isClaimed: false,
          claimedAt: null
        } : null
      }));
      
      const journeyData = {
        journeyName: customizations.journeyName || template.name,
        description: customizations.description || template.description,
        totalSteps: stepConfiguration.length,
        stepConfiguration,
        templateId: templateId,
        ...customizations
      };
      
      return await this.createJourney(studentId, journeyData);
    } catch (error) {
      console.error('Error creating journey from template:', error);
      throw error;
    }
  }

  // Auto-update all step progress for a journey
  async autoUpdateJourneyProgress(studentId) {
    try {
      console.log('Auto-updating journey progress for student:', studentId);
      
      const journey = await this.getJourneyForStudent(studentId);
      if (!journey) {
        console.log('No journey found for student:', studentId);
        return;
      }

      const completedSessions = await this.getCompletedSessions(studentId);
      console.log('📋 Found completed sessions:', completedSessions);
      console.log('📋 Completed sessions count:', completedSessions.length);
      
      let journeyUpdated = false;
      const updatedSteps = [];

      for (const step of journey.stepConfiguration) {
        console.log(`🎯 Checking step ${step.stepNumber}:`, {
          title: step.title,
          sessionIds: step.sessionIds,
          requiredCount: step.requiredCompletionCount,
          isCurrentlyCompleted: step.isCompleted
        });
        
        const progress = await this.calculateStepProgress(step, completedSessions);
        console.log(`📊 Step ${step.stepNumber} progress:`, progress);
        
        // If step should be completed but isn't marked as completed, update it
        if (progress.isCompleted && !step.isCompleted) {
          console.log(`Marking step ${step.stepNumber} as completed`);
          
          const completedAt = new Date().toISOString();
          step.isCompleted = true;
          step.completedAt = completedAt;
          
          // Also unlock the next step if it exists
          const nextStep = journey.stepConfiguration.find(s => s.stepNumber === step.stepNumber + 1);
          if (nextStep && !nextStep.unlockedAt) {
            console.log(`Unlocking next step ${nextStep.stepNumber}`);
            nextStep.unlockedAt = new Date().toISOString();
          }
          
          journeyUpdated = true;
        }
        
        updatedSteps.push(step);
      }

      // If any steps were updated, save the journey
      if (journeyUpdated) {
        console.log('Updating journey with new step statuses');
        await this.updateJourney(journey.$id, {
          stepConfiguration: updatedSteps
        });
        
        console.log('Journey progress auto-updated successfully');
        return true; // Indicate that updates were made
      } else {
        console.log('No journey updates needed');
        return false;
      }

    } catch (error) {
      console.error('Error auto-updating journey progress:', error);
      return false;
    }
  }

  // Delete a journey completely
  async deleteJourney(journeyId) {
    try {
      console.log('Deleting achievement journey:', journeyId);
      
      const response = await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.achievementJourneys,
        journeyId
      );
      
      console.log('Journey deleted successfully');
      return response;
    } catch (error) {
      console.error('Error deleting journey:', error);
      throw error;
    }
  }

  // Reset journey for a student (delete existing journey)
  async resetStudentJourney(studentId) {
    try {
      console.log('Resetting journey for student:', studentId);
      
      const journey = await this.getJourneyForStudent(studentId);
      if (journey) {
        await this.deleteJourney(journey.$id);
        console.log('Student journey reset successfully');
        return true;
      } else {
        console.log('No journey found to reset');
        return false;
      }
    } catch (error) {
      console.error('Error resetting student journey:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const achievementService = new AchievementService();
