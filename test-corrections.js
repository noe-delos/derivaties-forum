// Quick test to check if corrections are working
// Run this in browser console on the post page

const testCorrections = async () => {
  const postId = "795a2843-ef73-43c9-82a3-9a3c212b3b32";
  
  try {
    console.log("🔍 Testing corrections fetching...");
    
    // Test fetch all corrections
    const response = await fetch('/api/test-corrections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'fetchCorrections',
        postId: postId
      })
    });
    
    const result = await response.json();
    console.log('📋 Corrections test result:', result);
    
    if (result.allCorrections?.length === 0) {
      console.log("📝 No corrections found, creating test correction...");
      
      // Create a test correction
      const createResponse = await fetch('/api/test-corrections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createTestCorrection',
          postId: postId
        })
      });
      
      const createResult = await createResponse.json();
      console.log('✅ Test correction created:', createResult);
      
      // Fetch again to see if it appears
      const refetchResponse = await fetch('/api/test-corrections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fetchCorrections',
          postId: postId
        })
      });
      
      const refetchResult = await refetchResponse.json();
      console.log('🔄 After creating correction:', refetchResult);
    }
    
  } catch (error) {
    console.error('❌ Error testing corrections:', error);
  }
};

// Run this function to test:
console.log("🚀 Run testCorrections() to check corrections");
window.testCorrections = testCorrections;