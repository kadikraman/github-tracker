#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

static const CGFloat kPanelWidth = 340.0;
static const CGFloat kPanelHeight = 480.0;
static const CGFloat kPanelCornerRadius = 16.0;

/// Borderless panels refuse key status by default; we need it so the panel
/// auto-dismisses when the user clicks elsewhere (key resignation).
@interface GHTMenuBarPanel : NSPanel
@end

@implementation GHTMenuBarPanel
- (BOOL)canBecomeKeyWindow
{
  return YES;
}
@end

/// The RN surface repaints an opaque background when it mounts (after panel
/// creation), so it must be re-cleared post-show for the glass to read through.
static void GHTClearBackgrounds(NSView *view, NSInteger depth)
{
  view.wantsLayer = YES;
  view.layer.backgroundColor = NSColor.clearColor.CGColor;
  if ([view respondsToSelector:@selector(setBackgroundColor:)]) {
    [(id)view setBackgroundColor:[NSColor clearColor]];
  }
  if (depth > 0) {
    for (NSView *subview in view.subviews) {
      GHTClearBackgrounds(subview, depth - 1);
    }
  }
}

@implementation AppDelegate {
  NSStatusItem *_statusItem;
  GHTMenuBarPanel *_panel;
  NSView *_panelReactView;
}

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
  self.moduleName = @"main";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  self.dependencyProvider = [RCTAppDependencyProvider new];

  [super applicationDidFinishLaunching:notification];
// @generated begin expo-desktop-window-title - expo prebuild (DO NOT MODIFY) sync-77c583190f24378b7d293925061d0d0aa9f41a3f
  self.window.title = @"GitHub Tracker";
// @generated end expo-desktop-window-title

  [self setupStatusItem];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(openMainWindow)
                                               name:@"GHTOpenMainWindow"
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(closePopover)
                                               name:@"GHTClosePopover"
                                             object:nil];
}

- (void)setupStatusItem
{
  _statusItem = [[NSStatusBar systemStatusBar] statusItemWithLength:NSSquareStatusItemLength];
  NSImage *icon = [NSImage imageNamed:@"MenuBarIcon"];
  [icon setTemplate:YES];
  _statusItem.button.image = icon;
  _statusItem.button.target = self;
  _statusItem.button.action = @selector(togglePopover:);
}

- (void)togglePopover:(id)sender
{
  if (_panel.isVisible) {
    [self closePopover];
    return;
  }
  if (_panel == nil) {
    [self createPanel];
  }
  [self positionPanel];
  [_panel makeKeyAndOrderFront:nil];

  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.15 * NSEC_PER_SEC)),
                 dispatch_get_main_queue(), ^{
    if (self->_panelReactView != nil) {
      GHTClearBackgrounds(self->_panelReactView, 2);
    }
    [self->_panel invalidateShadow];
  });
}

- (void)createPanel
{
  NSRect frame = NSMakeRect(0, 0, kPanelWidth, kPanelHeight);

  NSView *rnView = [self.rootViewFactory viewWithModuleName:@"GitHubTrackerMenuBar"
                                          initialProperties:@{}];
  rnView.frame = frame;
  rnView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
  GHTClearBackgrounds(rnView, 0);
  _panelReactView = rnView;

  NSView *background;
  if (@available(macOS 26.0, *)) {
    NSGlassEffectView *glass = [[NSGlassEffectView alloc] initWithFrame:frame];
    glass.cornerRadius = kPanelCornerRadius;
    glass.contentView = rnView;
    background = glass;
  } else {
    NSVisualEffectView *effectView = [[NSVisualEffectView alloc] initWithFrame:frame];
    effectView.material = NSVisualEffectMaterialPopover;
    effectView.blendingMode = NSVisualEffectBlendingModeBehindWindow;
    effectView.state = NSVisualEffectStateActive;
    NSImage *mask = [NSImage imageWithSize:NSMakeSize(kPanelCornerRadius * 2 + 1,
                                                      kPanelCornerRadius * 2 + 1)
                                   flipped:NO
                            drawingHandler:^BOOL(NSRect rect) {
      [[NSColor blackColor] setFill];
      [[NSBezierPath bezierPathWithRoundedRect:rect
                                       xRadius:kPanelCornerRadius
                                       yRadius:kPanelCornerRadius] fill];
      return YES;
    }];
    mask.capInsets = NSEdgeInsetsMake(kPanelCornerRadius, kPanelCornerRadius,
                                      kPanelCornerRadius, kPanelCornerRadius);
    mask.resizingMode = NSImageResizingModeStretch;
    effectView.maskImage = mask;
    [effectView addSubview:rnView];
    background = effectView;
  }

  _panel = [[GHTMenuBarPanel alloc] initWithContentRect:frame
                                              styleMask:(NSWindowStyleMaskBorderless |
                                                         NSWindowStyleMaskNonactivatingPanel)
                                                backing:NSBackingStoreBuffered
                                                  defer:NO];
  _panel.level = NSPopUpMenuWindowLevel;
  _panel.opaque = NO;
  _panel.backgroundColor = [NSColor clearColor];
  _panel.hasShadow = YES;
  _panel.hidesOnDeactivate = NO;
  _panel.releasedWhenClosed = NO;

  // Clip everything (glass rim, RN surface) to one rounded rect so nothing
  // square pokes out past the corners.
  NSView *container = [[NSView alloc] initWithFrame:frame];
  container.wantsLayer = YES;
  container.layer.cornerRadius = kPanelCornerRadius;
  container.layer.masksToBounds = YES;
  background.frame = container.bounds;
  background.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
  [container addSubview:background];
  _panel.contentView = container;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(panelDidResignKey:)
                                               name:NSWindowDidResignKeyNotification
                                             object:_panel];
}

- (void)positionPanel
{
  NSStatusBarButton *button = _statusItem.button;
  NSRect buttonFrame = [button.window convertRectToScreen:[button convertRect:button.bounds
                                                                       toView:nil]];
  NSScreen *screen = button.window.screen ?: NSScreen.mainScreen;
  CGFloat x = NSMidX(buttonFrame) - kPanelWidth / 2.0;
  CGFloat minX = NSMinX(screen.visibleFrame) + 8.0;
  CGFloat maxX = NSMaxX(screen.visibleFrame) - kPanelWidth - 8.0;
  x = MIN(MAX(x, minX), maxX);
  CGFloat y = NSMinY(buttonFrame) - 6.0;
  [_panel setFrameTopLeftPoint:NSMakePoint(x, y)];
}

- (void)panelDidResignKey:(NSNotification *)notification
{
  [self closePopover];
}

- (void)openMainWindow
{
  [self closePopover];
  [NSApp activateIgnoringOtherApps:YES];
  [self.window makeKeyAndOrderFront:nil];
}

- (void)closePopover
{
  if (_panel.isVisible) {
    [_panel orderOut:nil];
  }
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
#ifdef RN_FABRIC_ENABLED
  return true;
#else
  return false;
#endif
}

@end
