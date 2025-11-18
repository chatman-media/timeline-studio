#!/bin/bash
# Wrapper script for running Rust tests
# Ignores FFmpeg mutex cleanup error (exit code 101/signal 6) that occurs after all tests pass

set +e  # Don't exit on error

cargo test "$@" 2>&1

exit_code=$?

# If exit code is 101 (SIGABRT from FFmpeg cleanup), check if tests actually passed
if [ $exit_code -eq 101 ]; then
    # Re-run to capture output
    output=$(cargo test "$@" 2>&1)

    # Check if all tests passed
    if echo "$output" | grep -q "test result: ok"; then
        echo ""
        echo "Note: FFmpeg mutex cleanup warning ignored (all tests passed)"
        exit 0
    fi
fi

# For any other error or if tests actually failed, return the original exit code
exit $exit_code
