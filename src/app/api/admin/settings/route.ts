import { NextRequest, NextResponse } from 'next/server';
import { store, Settings } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const key = searchParams.get('key');

    if (key) {
      const setting = await store.getSetting(key);
      return NextResponse.json({
        success: true,
        data: setting || null,
      });
    }

    let settings = await store.getAllSettings();

    if (category) {
      settings = settings.filter((s) => s.category === category);
    }

    // Group settings by category
    const groupedSettings: Record<string, Record<string, string>> = {};
    settings.forEach((s) => {
      if (!groupedSettings[s.category]) {
        groupedSettings[s.category] = {};
      }
      groupedSettings[s.category][s.key] = s.value;
    });

    return NextResponse.json({
      success: true,
      data: groupedSettings,
      raw: settings,
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings: settingsToUpdate } = body;

    if (!settingsToUpdate || typeof settingsToUpdate !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Settings object is required' },
        { status: 400 }
      );
    }

    const updatedSettings: Settings[] = [];

    // settingsToUpdate format: { key: { value, category } } or { key: value }
    for (const [key, data] of Object.entries(settingsToUpdate)) {
      const existingSetting = await store.getSetting(key);
      
      let value: string;
      let category: Settings['category'];

      if (typeof data === 'object' && data !== null && 'value' in data) {
        value = String((data as { value: unknown }).value);
        category = ((data as { category?: string }).category as Settings['category']) || existingSetting?.category || 'general';
      } else {
        value = String(data);
        category = existingSetting?.category || 'general';
      }

      const setting = await store.upsertSetting(key, value, category);
      if (setting) updatedSettings.push(setting);
    }

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: `${updatedSettings.length} setting(s) updated`,
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Setting key is required' },
        { status: 400 }
      );
    }

    const setting = await store.getSetting(key);
    if (!setting) {
      return NextResponse.json(
        { success: false, error: 'Setting not found' },
        { status: 404 }
      );
    }

    // Note: We don't have a deleteSetting method, as settings should generally not be deleted
    return NextResponse.json({ success: false, error: 'Settings cannot be deleted' }, { status: 400 });
  } catch (error) {
    console.error('Settings DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}
