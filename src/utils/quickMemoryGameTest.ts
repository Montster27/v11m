// Quick memory game test - creates a simple test in the browser
// Usage: Open browser console and run: quickMemoryTest()

(window as any).quickMemoryTest = function() {
  console.log('🃏 Starting Quick Memory Game Test...');
  
  // Test image loading
  const testImages = [
    'cassette.png', 'coffee_mug.png', 'flyer.png', 'id_card.png',
    'lava_lamp.png', 'notebook.png', 'socks.png', 'walkman.png'
  ];
  
  let loadedCount = 0;
  let errors = 0;
  
  testImages.forEach((imageName, index) => {
    const img = new Image();
    img.onload = function() {
      loadedCount++;
      console.log(`✅ Image ${index + 1}/${testImages.length} loaded: ${imageName}`);
      
      if (loadedCount + errors === testImages.length) {
        console.log(`🎯 Test Complete: ${loadedCount} loaded, ${errors} errors`);
        if (errors === 0) {
          console.log('🎉 All images loaded successfully! Memory game should display correctly.');
          console.log('💡 You can now test the game by navigating to a storylet that triggers a memory minigame.');
        } else {
          console.log('⚠️ Some images failed to load. Check the paths.');
        }
      }
    };
    
    img.onerror = function() {
      errors++;
      console.error(`❌ Image ${index + 1}/${testImages.length} failed: ${imageName}`);
      
      if (loadedCount + errors === testImages.length) {
        console.log(`🎯 Test Complete: ${loadedCount} loaded, ${errors} errors`);
        if (errors === 0) {
          console.log('🎉 All images loaded successfully! Memory game should display correctly.');
        } else {
          console.log('⚠️ Some images failed to load. Check the paths.');
        }
      }
    };
    
    img.src = `/images/memory-game/${imageName}`;
  });
  
  console.log(`📁 Testing image loading from: /images/memory-game/`);
  console.log(`🔄 Loading ${testImages.length} sample images...`);
};

console.log('🃏 Quick memory game test loaded. Run quickMemoryTest() to verify images.');