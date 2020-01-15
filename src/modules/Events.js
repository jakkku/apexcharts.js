import Utils from '../utils/Utils'

export default class Events {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.documentEvent = Utils.bind(this.documentEvent, this)
    this.windowResizeHandler = this.windowResize.bind(this)
  }

  addEventListener(name, handler) {
    const w = this.w

    if (w.globals.events.hasOwnProperty(name)) {
      w.globals.events[name].push(handler)
    } else {
      w.globals.events[name] = [handler]
    }
  }

  removeEventListener(name, handler) {
    const w = this.w
    if (!w.globals.events.hasOwnProperty(name)) {
      return
    }

    let index = w.globals.events[name].indexOf(handler)
    if (index !== -1) {
      w.globals.events[name].splice(index, 1)
    }
  }

  fireEvent(name, args) {
    const w = this.w

    if (!w.globals.events.hasOwnProperty(name)) {
      return
    }

    if (!args || !args.length) {
      args = []
    }

    let evs = w.globals.events[name]
    let l = evs.length

    for (let i = 0; i < l; i++) {
      evs[i].apply(null, args)
    }
  }

  setupEventHandlers() {
    const w = this.w
    const me = this.ctx

    let clickableArea = w.globals.dom.baseEl.querySelector(w.globals.chartClass)

    this.ctx.eventList.forEach((event) => {
      clickableArea.addEventListener(
        event,
        (e) => {
          const opts = Object.assign({}, w, {
            seriesIndex: w.globals.capturedSeriesIndex,
            dataPointIndex: w.globals.capturedDataPointIndex
          })

          if (e.type === 'mousemove' || e.type === 'touchmove') {
            if (typeof w.config.chart.events.mouseMove === 'function') {
              w.config.chart.events.mouseMove(e, me, opts)
            }
          } else if (
            (e.type === 'mouseup' && e.which === 1) ||
            e.type === 'touchend'
          ) {
            if (typeof w.config.chart.events.click === 'function') {
              w.config.chart.events.click(e, me, opts)
            }
            me.ctx.events.fireEvent('click', [e, me, opts])
          }
        },
        { capture: false, passive: true }
      )
    })

    this.ctx.eventList.forEach((event) => {
      document.addEventListener(event, this.documentEvent)
    })

    this.ctx.core.setupBrushHandler()
  }

  documentEvent(e) {
    const w = this.w

    if (e.type === 'click') {
      const target = e.target.className
      let elMenu = w.globals.dom.baseEl.querySelector('.apexcharts-menu')
      if (
        elMenu &&
        elMenu.classList.contains('apexcharts-menu-open') &&
        target !== 'apexcharts-menu-icon'
      ) {
        elMenu.classList.remove('apexcharts-menu-open')
      }
    }

    w.globals.clientX =
      e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
    w.globals.clientY =
      e.type === 'touchmove' ? e.touches[0].clientY : e.clientY
  }

  parentResizeCallback() {
    if (
      this.w.globals.animationEnded &&
      this.w.config.chart.redrawOnParentResize
    ) {
      this.windowResize()
    }
  }

  /**
   * Handle window resize and re-draw the whole chart.
   */
  windowResize() {
    clearTimeout(this.w.globals.resizeTimer)
    this.w.globals.resizeTimer = window.setTimeout(() => {
      this.w.globals.resized = true
      this.w.globals.dataChanged = false

      // we need to redraw the whole chart on window resize (with a small delay).
      this.ctx.update()
    }, 150)
  }
}
