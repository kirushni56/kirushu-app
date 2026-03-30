import webview
import os
import sys

def get_base_path():
    # PyInstaller creates a temp folder and stores path in _MEIPASS
    if hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.abspath(".")

if __name__ == '__main__':
    # Build path to index.html
    html_path = os.path.join(get_base_path(), 'index.html')
    
    # Create borderless or standard window
    window = webview.create_window(
        title='Kirushu - Habit Tracker', 
        url=f'file:///{html_path}', 
        width=550, 
        height=850,
        resizable=True
    )
    
    # Start app (uses local Edge or standard OS webview engine)
    webview.start(private_mode=False) # Ensure localStorage is kept between sessions
