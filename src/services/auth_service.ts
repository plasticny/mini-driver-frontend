import { webpage_api } from './api'
import { is_admin_ip } from './store'

export const IS_NOT_ADMIN = 0
export const IS_ADMIN = 1
export const IS_ADMIN_PENDING = 2
export const IS_ADMIN_UNKNOWN = 3
export type TAdminStatus = 0 | 1 | 2 | 3

export class AuthService {
  protected _admin_status : TAdminStatus = IS_ADMIN_UNKNOWN
  protected _admin_pass : string | undefined

  constructor () {
    this.check_admin_ip()
  }

  public set admin_pass (pass : string | undefined) {
    this._admin_pass = pass
  }

  public get admin_pass () : string | undefined {
    return this._admin_pass
  }

  public async check_admin_ip () : Promise<void> {
    while (this._admin_status === IS_ADMIN_PENDING || this._admin_status === IS_ADMIN_UNKNOWN) {
      if (this._admin_status === IS_ADMIN_UNKNOWN) {
        this._admin_status = IS_ADMIN_PENDING
        webpage_api.api_check_admin().then(res => {
          const result : boolean = res.data
          this._admin_status = result ? IS_ADMIN : IS_NOT_ADMIN
        })
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    is_admin_ip.value = this._admin_status === IS_ADMIN
  }

  public async check_admin_pass () : Promise<boolean> {
    return new Promise(resolve => {
      if (this._admin_pass === undefined) {
        resolve(false)
        return
      }
      webpage_api.api_check_admin_pass(this._admin_pass).then(res => {
        const result : boolean = res.data
        resolve(result)
      })
    })
  }
}
export const auth_service = new AuthService()
