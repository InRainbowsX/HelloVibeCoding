# Like Dedupe And Systemd Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add minimal per-browser discussion like dedupe on the frontend and provide a ready-to-use `systemd` service file for the API.

**Architecture:** Keep backend unchanged. Store liked discussion ids in browser `localStorage` and use that state to disable repeat likes in the list page and detail page. Add a deployment service unit file under version control and reference it from the ECS deployment guide.

**Tech Stack:** React, TypeScript, localStorage, systemd unit file, Markdown docs.
