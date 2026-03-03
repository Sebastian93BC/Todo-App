---
description: 'Use these guidelines when generating or updating tests.'
applyTo: tests/**
---
# [Project Name] Testing Guidelines

## Test conventions
* Write clear, focused tests that verify one behavior at a time
* Use descriptive test names that explain what is being tested and the expected outcome
* Follow Arrange-Act-Assert (AAA) pattern: set up test data, execute the code under test, verify results
* Keep tests independent - each test should run in isolation without depending on other tests
* Start with the simplest test case, then add edge cases and error conditions
* Tests should fail for the right reason - verify they catch the bugs they're meant to catch
* Mock external dependencies to keep tests fast and reliable
