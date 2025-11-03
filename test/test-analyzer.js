// test/test-analyzer.js

async function testAnalyzer() {
    const analyzer = new TensorFlowDLPAnalyzer();
    await analyzer.initialize();
    
    const testCases = [
        {
            content: "My credit card number is 4532-1234-5678-9010",
            expected: false,
            description: "Credit card number"
        },
        {
            content: "Let's meet for lunch tomorrow",
            expected: true,
            description: "Innocent message"
        },
        {
            content: "Confidential Q4 financial results show 25% revenue increase",
            expected: false,
            description: "Confidential business data"
        },
        {
            content: "API_KEY=sk_live_1234567890abcdef",
            expected: false,
            description: "API credentials"
        }
    ];
    
    for (const test of testCases) {
        const result = await analyzer.analyze(test.content, {
            url: 'https://external-site.com'
        });
        
        const passed = result.allowed === test.expected;
        console.log(`${passed ? '✓' : '✗'} ${test.description}`);
        console.log(`  Expected: ${test.expected ? 'allow' : 'block'}`);
        console.log(`  Got: ${result.allowed ? 'allow' : 'block'}`);
        console.log(`  Reason: ${result.reason}`);
        console.log(`  Time: ${result.analysisTime.toFixed(2)}ms\n`);
    }
}

testAnalyzer();
