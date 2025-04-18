// Test suite for Smart Daily Planner
class TestSuite {
    constructor() {
        this.tests = [];
        this.results = [];
        this.aiManager = window.aiManager;
    }

    async runTests() {
        console.log('Starting automated tests...');
        
        // Test 1: Basic AI Manager Initialization
        this.addTest('AI Manager Initialization', () => {
            return this.aiManager !== undefined && 
                   this.aiManager.userPatterns !== undefined;
        });

        // Test 2: Task Suggestion Generation
        this.addTest('Task Suggestion Generation', async () => {
            try {
                const suggestions = await this.aiManager.fetchAISuggestions('test');
                return Array.isArray(suggestions) && 
                       suggestions.length > 0 &&
                       suggestions.every(s => 
                           s.task && 
                           s.priority && 
                           s.estimatedDuration && 
                           s.category
                       );
            } catch (error) {
                console.error('Suggestion test failed:', error);
                return false;
            }
        });

        // Test 3: User Pattern Updates
        this.addTest('User Pattern Updates', () => {
            // Clear existing patterns for this test
            this.aiManager.userPatterns = { hours: {} };
            
            const testTask = {
                hour: '10:00',
                text: 'Test Task',
                completed: true
            };
            
            // Update patterns
            this.aiManager.updateUserPatterns(testTask);
            
            // Verify the pattern was created and has the correct structure
            const hourPattern = this.aiManager.userPatterns.hours['10'];
            return hourPattern !== undefined && 
                   hourPattern.total === 1 && 
                   hourPattern.completed === 1 &&
                   hourPattern.successRate === 100;
        });

        // Test 4: Fallback Suggestions
        this.addTest('Fallback Suggestions', () => {
            const suggestions = this.aiManager.getFallbackSuggestions();
            return Array.isArray(suggestions) && 
                   suggestions.length > 0 &&
                   suggestions.every(s => 
                       s.task && 
                       s.priority && 
                       s.estimatedDuration && 
                       s.category
                   );
        });

        // Test 5: Task History Management
        this.addTest('Task History Management', () => {
            const testTask = {
                date: new Date().toDateString(),
                completed: 5,
                total: 10,
                completionRate: 50
            };
            
            this.aiManager.saveDailyProgress(testTask.completed, testTask.total);
            return this.aiManager.taskHistory.length > 0;
        });

        // Run all tests
        for (const test of this.tests) {
            const result = await this.runTest(test);
            this.results.push(result);
        }

        this.displayResults();
    }

    addTest(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    async runTest(test) {
        try {
            const passed = await test.testFunction();
            return {
                name: test.name,
                passed,
                error: null
            };
        } catch (error) {
            return {
                name: test.name,
                passed: false,
                error: error.message
            };
        }
    }

    displayResults() {
        console.log('\nTest Results:');
        console.log('-------------------');
        
        this.results.forEach(result => {
            const status = result.passed ? '✅ PASSED' : '❌ FAILED';
            console.log(`${status} - ${result.name}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        });

        const passedCount = this.results.filter(r => r.passed).length;
        const totalCount = this.results.length;
        console.log('\nSummary:');
        console.log(`${passedCount}/${totalCount} tests passed`);
    }
}

// Create and run test suite when the page loads
window.addEventListener('load', () => {
    const testSuite = new TestSuite();
    testSuite.runTests();
}); 