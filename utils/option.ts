import { Accessor, createState } from "ags"
import { cacheDir, ensureDirectory } from "."
import GLib from "gi://GLib?version=2.0"
import { monitorFile, readFile, readFileAsync, writeFile } from "ags/file"
import Gio from "gi://Gio?version=2.0"

function getNestedValue(obj: Record<string, any>, keyPath: string) {
  const keys = keyPath.split(".")
  let current = obj

  for (let key of keys) {
    if (current && current.hasOwnProperty(key)) {
      current = current[key]
    } else {
      return undefined
    }
  }

  return current
}

function setNestedValue<T>(
  obj: Record<string, any>,
  keyPath: string,
  value: T,
) {
  const keys = keyPath.split(".")
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]

    if (!current[key]) {
      current[key] = {}
    }

    current = current[key]
  }

  current[keys[keys.length - 1]] = value
}

type Callback = () => void
type DisposeFn = () => void

export class Opt<T = unknown> extends Accessor<T> {
  constructor(initial: T, { cached = false }: { cached?: boolean }) {
    super(
      () => this.currentValue,
      (callback: Callback): DisposeFn => {
        this.subscribers.add(callback)
        return () => this.subscribers.delete(callback)
      },
    )
    this.currentValue = initial
    this.cached = cached
  }

  subscribers = new Set<Callback>()
  currentValue: T
  id = ""
  cached = false

  set(newValue: T): void {
    const value: T =
      typeof newValue === "function" ? newValue(this.currentValue) : newValue
    if (!Object.is(this.currentValue, value)) {
      this.currentValue = value
      Array.from(this.subscribers).forEach((cb) => cb())
    }
    if (this.cached) {
      readFileAsync(`${cacheDir}/options.json`)
        .then((content) => {
          const cache = JSON.parse(content)
          cache[this.id] = value
          writeFile(`${cacheDir}/options.json`, JSON.stringify(cache, null, 2))
        })
        .catch(() => "")
    }
  }

  init(configFile: string) {
    const dir = this.cached ? `${cacheDir}/options.json` : configFile

    if (GLib.file_test(dir, GLib.FileTest.EXISTS)) {
      let config: Record<string, any>
      try {
        config = JSON.parse(readFile(dir))
      } catch {
        config = {}
      }
      const configV = this.cached
        ? config[this.id]
        : getNestedValue(config, this.id)
      if (configV !== undefined) {
        this.set(configV)
      }
    }
  }
}

export const opt = <T>(initial: T, opts = {}) => new Opt(initial, opts)

function getOptions(object: Record<string, any>, path = ""): Opt[] {
  return Object.keys(object).flatMap((key) => {
    const obj = object[key]
    const id = path ? path + "." + key : key

    if (obj instanceof Opt) {
      obj.id = id
      return obj
    }

    if (typeof obj === "object") return getOptions(obj, id)

    return []
  })
}

function transformObject(obj: Record<string, any>, initial?: boolean) {
  if (obj instanceof Opt) {
    if (obj.cached) {
      return
    } else {
      if (initial) {
        return obj.currentValue
      } else {
        return obj()
      }
    }
  }

  if (typeof obj !== "object") return

  const newObj: Record<string, any> = {}

  Object.keys(obj).forEach((key) => {
    newObj[key] = transformObject(obj[key], initial)
  })

  const length = Object.keys(JSON.parse(JSON.stringify(newObj))).length

  return length > 0 ? newObj : undefined
}

function deepMerge(target: Record<string, any>, source: Record<string, any>) {
  if (typeof target !== "object" || target === null) {
    return source
  }

  if (typeof source !== "object" || source === null) {
    return source
  }

  const result: Record<string, any> = Array.isArray(target) ? [] : { ...target }

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (Array.isArray(source[key])) {
        result[key] = [...source[key]]
      } else if (typeof source[key] === "object" && source[key] !== null) {
        result[key] = deepMerge(target[key], source[key])
      } else {
        result[key] = source[key]
      }
    }
  }

  return result
}

export function mkOptions<T extends object>(configFile: string, object: T) {
  for (const opt of getOptions(object)) {
    opt.init(configFile)
  }

  ensureDirectory(configFile.split("/").slice(0, -1).join("/"))
  const defaultConfig = transformObject(object, true)
  const [configVar, configVarSet] = createState(transformObject(object))

  if (GLib.file_test(configFile, GLib.FileTest.EXISTS)) {
    let configData: object
    try {
      configData = JSON.parse(readFile(configFile) || "{}")
    } catch {
      configData = {}
    }
    configVarSet(deepMerge(configVar.peek(), configData))
  }

  function updateConfig(
    oldConfig: Record<string, any>,
    newConfig: Record<string, any>,
    path = "",
  ) {
    for (const key in newConfig) {
      const fullPath = path ? `${path}.${key}` : key
      if (
        typeof newConfig[key] === "object" &&
        !Array.isArray(newConfig[key])
      ) {
        updateConfig(oldConfig[key], newConfig[key], fullPath)
      } else if (
        JSON.stringify(oldConfig[key]) != JSON.stringify(newConfig[key])
      ) {
        const conf = getOptions(object).find((c) => c.id == fullPath)
        if (conf?.cached) {
          return
        }
        print(`${fullPath} updated`)
        if (conf) {
          const newC = configVar.peek()
          setNestedValue(newC, fullPath, newConfig[key])
          configVarSet(newC)
          conf.set(newConfig[key])
        }
      }
    }
  }

  monitorFile(configFile, (_, event) => {
    if (event == Gio.FileMonitorEvent.CHANGES_DONE_HINT) {
      let cache: object
      try {
        cache = JSON.parse(readFile(configFile) || "{}")
      } catch {
        cache = {}
      }
      updateConfig(configVar.peek(), deepMerge(defaultConfig, cache))
    }
  })

  return Object.assign(object, {
    configFile,
    handler(deps: string[], callback: () => void) {
      for (const opt of getOptions(object)) {
        if (deps.some((i) => opt.id.startsWith(i))) opt.subscribe(callback)
      }
    },
  })
}
