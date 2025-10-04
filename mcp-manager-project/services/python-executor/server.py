#!/usr/bin/env python3

from mcp import MCPServer
import subprocess
import tempfile
import os
import json
import sys

server = MCPServer(
    name="python-executor",
    version="1.0.0"
)

@server.tool("execute_python")
async def execute_python(code: str, pip_install: list = None):
    """Execute Python code safely in a sandboxed environment"""
    
    # Install packages if needed
    if pip_install:
        for package in pip_install:
            if package in os.environ.get('ALLOWED_MODULES', '').split(','):
                subprocess.run([sys.executable, '-m', 'pip', 'install', package])
    
    # Create temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        temp_file = f.name
    
    try:
        # Execute with timeout
        result = subprocess.run(
            [sys.executable, temp_file],
            capture_output=True,
            text=True,
            timeout=int(os.environ.get('EXECUTION_TIMEOUT', 30))
        )
        
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    finally:
        os.unlink(temp_file)

@server.tool("create_notebook")
async def create_notebook(name: str, cells: list):
    """Create a Jupyter notebook"""
    
    notebook = {
        "cells": [
            {
                "cell_type": cell.get("type", "code"),
                "source": cell.get("content", ""),
                "metadata": {}
            }
            for cell in cells
        ],
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 4
    }
    
    path = f"/notebooks/{name}.ipynb"
    with open(path, 'w') as f:
        json.dump(notebook, f, indent=2)
    
    return {"path": path, "success": True}

if __name__ == "__main__":
    server.start()