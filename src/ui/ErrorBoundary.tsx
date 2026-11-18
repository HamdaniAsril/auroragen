import { Component, type ReactNode } from 'react'
import { Unsupported } from './Unsupported'

/** If the renderer can't start on this device (say a driver rejects the shader), explain instead of going blank. */
export class StudioErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error(error)
  }

  render() {
    return this.state.failed ? <Unsupported /> : this.props.children
  }
}
